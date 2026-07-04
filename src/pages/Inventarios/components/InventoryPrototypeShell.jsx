import { Box, Chip, Grid, Paper, Stack, Typography } from "@mui/material";

import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";

import {
  inventoryHeaderPaperSx,
  inventoryIconBadgeSx,
  inventoryPagePaperSx,
  inventoryPageShellSx,
  inventoryResultChipSx,
  inventoryUi,
} from "./inventoryDbanuTheme";

export default function InventoryPrototypeShell({
  icon,
  title,
  description,
  badge,
  bullets = [],
  flow = [],
  nextSteps = [],
  status = "ESTRUCTURA LISTA",
}) {
  return (
    <Box sx={inventoryPageShellSx}>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        <Stack spacing={3}>
          <Paper elevation={0} sx={inventoryHeaderPaperSx}>
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={inventoryIconBadgeSx}>{icon || <ConstructionOutlinedIcon />}</Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: "#1e293b", fontSize: "17px", lineHeight: 1.1 }}>
                  {title}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: inventoryUi.muted, mt: 0.5 }}>
                  {description}
                </Typography>
              </Box>
            </Stack>

            <Box sx={inventoryResultChipSx}>{status}</Box>
          </Paper>

          <Paper elevation={0} sx={{ ...inventoryPagePaperSx, overflow: "hidden" }}>
            <Box sx={{ px: 4, py: 2.25, borderBottom: `1px solid ${inventoryUi.border}` }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                <Box>
                  <Typography sx={{ fontSize: "12px", fontWeight: 900, color: inventoryUi.blue, letterSpacing: "0.7px" }}>
                    {badge}
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 900, color: inventoryUi.text, mt: 0.4 }}>
                    Base visual migrada desde `inventarios_prueba`
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {bullets.slice(0, 3).map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      size="small"
                      sx={{
                        height: 26,
                        borderRadius: "8px",
                        bgcolor: inventoryUi.blueSoft,
                        color: inventoryUi.blueDark,
                        border: `1px solid ${inventoryUi.blueBorder}`,
                        fontWeight: 700,
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ px: 4, py: 3 }}>
              <Grid container spacing={2.2}>
                <Grid item xs={12} md={5}>
                  <Paper
                    elevation={0}
                    sx={{
                      height: "100%",
                      p: 3,
                      borderRadius: "10px",
                      bgcolor: "#fafcff",
                      border: `1px solid ${inventoryUi.blueBorder}`,
                    }}
                  >
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, color: inventoryUi.blue, mb: 1.5 }}>
                      ENFOQUE DE LA PANTALLA
                    </Typography>
                    <Stack spacing={1.3}>
                      {bullets.map((item) => (
                        <Box key={item} sx={{ display: "flex", gap: 1.2 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              mt: "7px",
                              borderRadius: "50%",
                              bgcolor: inventoryUi.mustard,
                              flexShrink: 0,
                            }}
                          />
                          <Typography sx={{ fontSize: "13px", color: inventoryUi.text, fontWeight: 600 }}>
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Grid container spacing={2.2}>
                    {flow.map((step, index) => (
                      <Grid item xs={12} sm={6} key={step.title}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.4,
                            height: "100%",
                            borderRadius: "10px",
                            border: `1px solid ${inventoryUi.border}`,
                            bgcolor: "#ffffff",
                          }}
                        >
                          <Typography sx={{ fontSize: "11px", fontWeight: 900, color: inventoryUi.mustard, mb: 0.7 }}>
                            PASO {index + 1}
                          </Typography>
                          <Typography sx={{ fontSize: "14px", fontWeight: 900, color: inventoryUi.text, mb: 0.8 }}>
                            {step.title}
                          </Typography>
                          <Typography sx={{ fontSize: "12px", color: inventoryUi.muted, lineHeight: 1.55 }}>
                            {step.description}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.6,
                      borderRadius: "10px",
                      border: `1px solid ${inventoryUi.border}`,
                      bgcolor: "#ffffff",
                    }}
                  >
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, color: inventoryUi.blue, mb: 1.4 }}>
                      SIGUIENTE CONSTRUCCIÓN
                    </Typography>
                    <Grid container spacing={1.6}>
                      {nextSteps.map((item) => (
                        <Grid item xs={12} md={4} key={item}>
                          <Box
                            sx={{
                              p: 1.6,
                              borderRadius: "8px",
                              bgcolor: "#f8fafc",
                              border: `1px dashed ${inventoryUi.border}`,
                              fontSize: "12px",
                              fontWeight: 700,
                              color: inventoryUi.text,
                            }}
                          >
                            {item}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
