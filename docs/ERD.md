# Модель даних (ERD)

Повне визначення — `prisma/schema.prisma` (джерело істини). Цей документ пояснює
взаємозв'язки та темпоральний дизайн словами.

```
LegalAct 1───* SourceVersion
LegalAct 1───* TerritoryStatusRecord
LegalAct 1───* ChangelogEntry

SourceVersion 1───* ImportJob
SourceVersion 1───* TerritoryStatusRecord
SourceVersion 1───* ChangelogEntry
SourceVersion 1───1 SourceVersion (supersedes/supersededBy, ланцюг редакцій)

StatusCategory 1───* TerritoryStatusRecord

TerritorialUnit 1───* TerritorialUnit (parent/children, самопосилання — ієрархія)
TerritorialUnit 1───* SettlementName
TerritorialUnit 1───* TerritoryStatusRecord

ImportJob 1───* ValidationIssue

User 1───* AuditLog
User 1───* ReportJob
```

## Принцип: жоден історичний рядок не перезаписується

- **`LegalAct`** — незмінний після створення (окрім поля `status`, яке
  переходить `ACTIVE → SUPERSEDED/REPEALED`, але сам акт не редагується).
- **`SourceVersion`** — кожна редакція джерела — окремий рядок. Нова редакція
  додається, попередня НЕ видаляється; `supersedesId` утворює явний ланцюг.
  Rollback (`docs/ADMIN_WORKFLOW.md`) переводить версію в `ROLLED_BACK`, а не
  видаляє її.
- **`TerritoryStatusRecord`** — записи прив'язані до конкретної
  `sourceVersionId`. Коли виходить нова редакція, вона отримує СВОЇ власні
  записи (навіть якщо значення ідентичне попередній редакції — це навмисне
  дублювання заради незмінності історії, а не нормалізація "поки не
  зміниться").
- **`TerritorialUnit`** — перейменування чи зміна коду не змінює наявний
  рядок: попередній рядок закривається (`validTo`), новий створюється
  (`validFrom`). Назви зберігаються окремо в `SettlementName` з власним
  періодом дії та типом (`OFFICIAL` / `FORMER` / `ALTERNATIVE` /
  `TRANSLITERATION`).
- **`AuditLog`** — append-only, ніколи не редагується і не видаляється.

## Чому статус території НЕ є прямим полем `TerritorialUnit`

Правовий статус — це не властивість одиниці, а **твердження конкретної
редакції конкретного нормативного акта на конкретний період**. Тому статус
живе в окремій сутності `TerritoryStatusRecord`, яка посилається одночасно на
одиницю, категорію, редакцію джерела і сам акт — це і є "ланцюг доказів"
(`evidence chain`), що вимагає розділ 3 ТЗ:

```
запит користувача → ідентифікований населений пункт (TerritorialUnit)
                  → код КАТОТТГ (TerritorialUnit.katottg)
                  → громада/район/область (parentId ланцюг)
                  → відповідний запис Переліку (TerritoryStatusRecord)
                  → категорія (StatusCategory)
                  → дата початку/завершення (TerritoryStatusRecord.startDate/endDate)
                  → нормативний акт (LegalAct)
                  → редакція (SourceVersion)
                  → дата перевірки (SourceVersion.publishedAt)
```

Кожен крок цього ланцюга повертається API (`evidenceChain` у відповіді
`GET /api/territories/{katottg}/status`) і показується на картці території.

## Чому рівень запису (`recordLevel`) — окреме поле, а не похідне від типу одиниці

Той самий текстовий запис Переліку може стосуватися одиниці будь-якого типу
(місто, село, громада), тому рівень деталізації запису (`SETTLEMENT` /
`HROMADA` / `RAION` / `OBLAST`) зберігається явно на самому записі — це і є
основа пріоритету рушія (найконкретніший рівень перемагає), а не властивість,
яку можна вивести з `TerritorialUnit.type`.

## Індекси та продуктивність

- `SettlementName.nameNormalized` — індексовано, використовується для
  trigram-пошуку (`pg_trgm`, оператор `%` + `similarity()`).
- `TerritoryStatusRecord(territorialUnitId, startDate)` — складений індекс для
  швидкого пошуку записів одиниці, відсортованих у часі (timeline, rules
  engine).
- `TerritorialUnit.katottg` — індексовано для точного пошуку за кодом.

Відома межа для реального масштабу даних: аналітика (`computeAnalyticsSummary`)
застосовує rules engine до кожної звітної одиниці "з нуля" при кожному запиті
— прийнятно для сотень одиниць, але для десятків тисяч населених пунктів
потребує матеріалізованої проєкції, що оновлюється при публікації редакції
(див. `docs/KNOWN_LIMITATIONS.md`).
