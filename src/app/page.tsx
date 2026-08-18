import { Alert, Box, Container, Stack, Typography } from "@mui/material";
import { SearchBox } from "@/components/SearchBox";

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, md: 8 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Статус території
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Знайдіть населений пункт або територіальну громаду, щоб дізнатися їхній офіційний правовий статус
            відповідно до чинного законодавства України — з правовою підставою, датою актуальності та посиланням
            на джерело.
          </Typography>
        </Box>

        <SearchBox autoFocus />

        <Alert severity="warning" variant="outlined">
          <strong>Демонстраційний режим.</strong> У цьому середовищі використовуються вигадані навчальні дані
          (немає доступу до офіційних джерел). Жоден результат пошуку не відображає реальний правовий статус
          реальної території. Детальніше — на сторінці{" "}
          <a href="/methodology">«Методологія»</a>.
        </Alert>

        <Alert severity="info" variant="outlined">
          Це інформаційно-аналітичний інструмент, а не заміна офіційної юридичної консультації. Кожна відповідь
          містить правову підставу та дату актуальності даних.
        </Alert>
      </Stack>
    </Container>
  );
}
