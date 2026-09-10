import { Tab, Tabs } from '@mui/material'

/** Navegación por pestañas compartida y adaptable para todos los módulos. */
export function PestanasEstandar({ value, onChange, opciones, sx = {}, ...props }) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{
        minHeight: 44,
        borderBottom: '1px solid #dbe5f0',
        bgcolor: '#f8fafc',
        px: { xs: 0.5, sm: 1.5 },
        '& .MuiTab-root': { minHeight: 44, minWidth: 'auto', px: 1.4, textTransform: 'none', fontSize: 12.5, fontWeight: 700, color: 'text.secondary' },
        '& .Mui-selected': { fontWeight: 850, color: 'primary.main' },
        '& .MuiTabs-indicator': { height: 2, borderRadius: '2px 2px 0 0' },
        ...sx,
      }}
      {...props}
    >
      {opciones.map(({ value: optionValue, label, icon, disabled }) => (
        <Tab key={optionValue ?? label} value={optionValue} label={label} icon={icon} iconPosition={icon ? 'start' : undefined} disabled={disabled} />
      ))}
    </Tabs>
  )
}
