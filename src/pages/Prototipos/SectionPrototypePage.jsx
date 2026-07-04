import { Box, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function SectionPrototypePage({
  title,
  description,
  badge = "PROTO",
  bullets = [],
  nextSteps = [],
  flow = [],
}) {
  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: "var(--tg-radius-sm)" }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "var(--tg-radius-sm)",
                  border: "1px solid var(--tg-card-border)",
                  backgroundColor: "rgba(242, 177, 0, 0.12)",
                  color: "var(--tg-primary-strong)",
                }}
              >
                <AutoAwesomeIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.78, maxWidth: 840 }}>
                  {description}
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={badge}
              sx={{
                borderRadius: "var(--tg-radius-xs)",
                fontWeight: 900,
                backgroundColor: "rgba(242, 177, 0, 0.12)",
                color: "var(--tg-primary-strong)",
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: "var(--tg-radius-sm)" }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Alcance de esta sección</Typography>
              <Stack spacing={1}>
                {bullets.map((item) => (
                  <Typography key={item} variant="body2" sx={{ opacity: 0.84 }}>
                    • {item}
                  </Typography>
                ))}
              </Stack>
            </Box>

            <Divider />

            {flow.length ? (
              <>
                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1.5 }}>Flujo operativo previsto</Typography>
                  <Grid container spacing={1.5}>
                    {flow.map((item, index) => (
                      <Grid key={item.title} item xs={12} md={6} lg={3}>
                        <Box
                          sx={{
                            height: "100%",
                            border: "1px solid var(--tg-card-border)",
                            borderRadius: "var(--tg-radius-xs)",
                            background:
                              "linear-gradient(180deg, rgba(242,177,0,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                            p: 1.75,
                          }}
                        >
                          <Typography
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 26,
                              height: 26,
                              borderRadius: "var(--tg-radius-xs)",
                              fontWeight: 900,
                              mb: 1.2,
                              backgroundColor: "rgba(242, 177, 0, 0.18)",
                              color: "var(--tg-primary-strong)",
                            }}
                          >
                            {index + 1}
                          </Typography>
                          <Typography sx={{ fontWeight: 900, mb: 0.6 }}>{item.title}</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.82 }}>
                            {item.description}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Divider />
              </>
            ) : null}

            <Box>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Siguiente paso recomendado</Typography>
              <Stack spacing={1}>
                {nextSteps.map((item) => (
                  <Typography key={item} variant="body2" sx={{ opacity: 0.84 }}>
                    • {item}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
