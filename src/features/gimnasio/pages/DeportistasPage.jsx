          <Box
            sx={{
              height: 40,
              boxSizing: 'border-box',
              px: 1.25,
              border: '1px solid #dbe5f0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8fafc',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  name="renovacion_automatica"
                  checked={Boolean(membresiaForm.renovacion_automatica)}
                  onChange={handleMembresiaChange}
                  size="small"
                />
              }
              label="Renovación automática"
              sx={{ m: 0 }}
            />
          </Box>

          {membresiaForm.id && !membresiaForm.cantidad_periodos_contratados ? (
          <Box
            sx={{
              height: 40,
              boxSizing: 'border-box',
              px: 1.25,
              border: '1px solid #dbe5f0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8fafc',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  name="congelar_membresia"
                  checked={Boolean(membresiaForm.congelar_membresia)}
                  onChange={handleMembresiaChange}
                  size="small"
                />
              }
              label="Congelar membresía"
              sx={{ m: 0 }}
            />
          </Box>
          ) : null}
        </Box>

        {esContratoNuevo ? (
          <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Contrato y calendario de cuotas</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Cada período genera su cuota. Los importes y la vigencia final se validan en Laravel. Los días de gracia no modifican el vencimiento financiero.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, mb: 1.5 }}>
              <TextField label="Períodos contratados" name="cantidad_periodos_contratados" type="number" required size="small"
                value={membresiaForm.cantidad_periodos_contratados || ''} onChange={handleMembresiaChange}
                slotProps={{ htmlInput: { min: 1, max: 36, step: 1 } }} helperText="De 1 a 36 períodos." />
              <TextField label="Fecha del primer pago" name="fecha_primer_pago" type="date" required size="small"
                value={membresiaForm.fecha_primer_pago || ''} onChange={handleMembresiaChange}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: membresiaForm.fecha_inicio || undefined } }}
                helperText="Vencimiento financiero de la primera cuota." />
            </Box>
            <CalendarioCuotasPreview filas={calendarioContratoPreview} />
          </Box>
        ) : null}

        {membresiaForm.id && membresiaForm.cuotas?.length ? (
          <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Cuotas registradas</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} flexWrap="wrap" useFlexGap gap={1}>
              {membresiaForm.cuotas.map((cuota) => (
                <Box key={cuota.id} sx={{ p: 1.25, minWidth: 180, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={700}>Cuota {cuota.numero_cuota} · ${Number(cuota.monto).toFixed(2)}</Typography>
                  <Typography variant="caption" display="block">Vence: {limpiarFechaMembresia(cuota.fecha_vencimiento)}</Typography>
                  <Typography variant="caption" color="text.secondary">{cuota.venta_estado || cuota.estado} · Pagado: ${Number(cuota.monto_pagado || 0).toFixed(2)}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : null}

        <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid #dbe5f0', borderRadius: 1.5, bgcolor: '#fafbfc' }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Sedes autorizadas para ingresar *</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Selecciona una o varias sedes a las que podrá ingresar con esta membresía.
            En los pases diarios, la tarifa se calcula según la sede donde se realice el cobro.
          </Typography>
          <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
            {sedes.map((sede) => {
              const seleccionada = (membresiaForm.sedes_habilitadas || [])
                .some((id) => String(id) === String(sede.id_sede));
              return (
                <Button key={sede.id_sede} type="button"
                  variant={seleccionada ? 'contained' : 'outlined'}
                  aria-pressed={seleccionada}
                  startIcon={seleccionada ? <CheckRoundedIcon sx={{ fontSize: 19 }} /> : <LocationCityOutlinedIcon sx={{ fontSize: 19 }} />}
                  onClick={() => setMembresiaForm((actual) => {
                    const anteriores = (actual.sedes_habilitadas || []).map(Number).filter(Boolean);
                    const id = Number(sede.id_sede);
                    const nuevas = anteriores.includes(id)
                      ? anteriores.filter((valor) => valor !== id)
                      : Array.from(new Set([...anteriores, id]));
                    if (!nuevas.length) {
                      showNotificacion('Debes habilitar al menos una sede para la membresía.', 'warning');
                      return actual;
                    }
                    const sedePrincipal = nuevas.includes(Number(actual.sede_id))
                      ? Number(actual.sede_id)
                      : nuevas[0];
                    return { ...actual, sede_id: sedePrincipal, sedes_habilitadas: nuevas };
                  })}
                  sx={{
                    textTransform: 'none', fontSize: 13, fontWeight: 800,
                    minHeight: 42, minWidth: 145, px: 2, borderRadius: 1.7,
                    boxShadow: seleccionada ? '0 2px 5px rgba(155, 111, 0, 0.16)' : 'none',
                    border: '1px solid', borderColor: seleccionada ? '#d3a018' : '#dbe5f0',
                    bgcolor: seleccionada ? '#d4a017' : '#fff',
                    color: seleccionada ? '#14243c' : '#475467',
                    '&:hover': {
                      bgcolor: seleccionada ? '#bd8e0f' : '#fff8e5',
                      borderColor: '#d4a017',
                      boxShadow: seleccionada ? '0 3px 8px rgba(155, 111, 0, 0.2)' : 'none',
                    },
                    '&:focus-visible': { outline: '2px solid #14243c', outlineOffset: 2 },
                  }}
                >
                  {sede.nombre}
                </Button>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ mt: 1.25, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>
            Configuración comercial
          </Typography>
          {membresiaForm.plan_id && String(planMembresiaSeleccionado?.tipo_producto || 'MEMBRESIA').toUpperCase() !== 'PASE_DIARIO' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {planMembresiaSeleccionado?.generar_venta && planMembresiaSeleccionado?.requiere_pago
                ? 'Venta inicial pendiente de cobro'
                : 'Sin venta inicial automática'}
            </Typography>
          )}
          {permiteCobroProgramado && !membresiaForm.cantidad_periodos_contratados && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 1.5 }}>
              <TextField fullWidth size="small" label="Día de pago" name="dia_pago" type="number"
                value={membresiaForm.dia_pago ?? ''} onChange={handleMembresiaChange}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, max: 31 } }} />
              <TextField fullWidth size="small" label="Próximo cobro"
                value={proximoCobroPreview || 'Automático'}
                slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }} />
              <Box sx={{ minHeight: 40, px: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                <FormControlLabel control={<Switch size="small" name="generar_venta_automatica"
                  checked={Boolean(membresiaForm.generar_venta_automatica)} onChange={handleMembresiaChange} />}
                  label="Renovaciones automáticas" sx={{ m: 0 }} />
              </Box>
            </Box>
          )}
          <FormControlLabel sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 700 } }}
            control={<Switch size="small" checked={requiereDescuento}
              onChange={(e) => setRequiereDescuento(e.target.checked)} />}
            label="Aplicar descuento" />
          {requiereDescuento && (
            <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
              <TextField fullWidth size="small" select label="Tipo de descuento" value={descuentoMembresia.tipo}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, tipo: e.target.value }))}>
                <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
                <MenuItem value="FIJO">Valor fijo ($)</MenuItem>
              </TextField>
              <TextField fullWidth size="small" type="number" label="Descuento" value={descuentoMembresia.valor}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, valor: e.target.value }))}
                error={false}
                sx={descuentoInvalido ? {
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d89b25 !important', borderWidth: 1.5 },
                  '& .MuiFormHelperText-root': { color: '#996515' },
                } : undefined}
                helperText={descuentoInvalido
                  ? descuentoMembresia.tipo === 'FIJO'
                    ? `Máximo permitido: ${precioBaseResumen.toFixed(2)}`
                    : 'Ingresa un porcentaje entre 0 y 100.'
                  : descuentoMembresia.tipo === 'FIJO' && precioMembresiaPreview !== null
                    ? `Hasta ${precioBaseResumen.toFixed(2)}`
                    : ''}
                slotProps={{ htmlInput: { min: 0.01, max: descuentoMembresia.tipo === 'PORCENTAJE' ? 100 : (precioMembresiaPreview ?? undefined), step: 0.01 } }} />
              <TextField fullWidth size="small" label="Motivo / autorización" value={descuentoMembresia.motivo}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, motivo: e.target.value }))} />
              <TextField fullWidth size="small" type="date" label="Desde"
                value={descuentoMembresia.fecha_inicio || membresiaForm.fecha_inicio || ''}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, fecha_inicio: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth size="small" type="date" label="Hasta (opcional)" value={descuentoMembresia.fecha_fin}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, fecha_fin: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
          )}
          {precioMembresiaPreview !== null && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2,
              px: 1.5, py: 1.15, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="body2">Precio: <strong>${precioBaseResumen.toFixed(2)}</strong></Typography>
              <Typography variant="body2">Descuento: <strong>${importeDescuentoPreview.toFixed(2)}</strong></Typography>
              <Typography variant="body2" sx={{ color: descuentoInvalido ? '#996515' : 'success.dark', fontWeight: 800 }}>
                {descuentoInvalido
                  ? 'Corrige el descuento para calcular el total'
                  : `Total a pagar: ${Math.max(0, precioBaseResumen - importeDescuentoPreview).toFixed(2)}`}
              </Typography>
            </Box>
          )}
        </Box>

        {membresiaForm.id && !membresiaForm.cantidad_periodos_contratados && membresiaForm.congelar_membresia ? (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              border: '1px solid #dbe5f0',
              borderRadius: 1.5,
              bgcolor: '#fbfdff',
            }}
          >
            <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>
              Período de congelación
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
              <TextField
                label="Desde"
                name="fecha_congelacion_inicio"
                type="date"
                value={membresiaForm.fecha_congelacion_inicio || ''}
                onChange={handleMembresiaChange}
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Hasta"
                name="fecha_congelacion_fin"
                type="date"
                value={membresiaForm.fecha_congelacion_fin || ''}
                onChange={handleMembresiaChange}
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              La congelación pausa temporalmente la membresía; no equivale a días de gracia ni a cancelación.
            </Typography>
          </Box>
        ) : null}
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar onClick={handleGuardarMembresia} />
        </Stack>
      </Box> : null}
      {vistaMembresia === 'listado' && <Box sx={formStyles.seccion}>
        <GestionToolbar total={membresiasFiltradas.length} busqueda={buscarMembresia}
          onBusqueda={(valor) => { setBuscarMembresia(valor); setPaginaMembresia(1); }}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevaMembresia}>Añadir</Button>} />
        <TablaGestion total={membresiasCliente.length} filtrados={membresiasFiltradas.length}
          cargando={cargandoFicha} page={paginaMembresia} rowsPerPage={porPaginaMembresia}
          onPageChange={setPaginaMembresia} onRowsPerPageChange={(numero) => { setPorPaginaMembresia(numero); setPaginaMembresia(1); }}>
          <TableHead><TableRow>
            {['plan','vigencia','precio','estado'].map((campo) => <FilterHeaderCell key={campo}
              value={filtrosMembresia[campo]} onChange={(valores) => filtrarMembresia(campo, valores)}
              options={opcionesExcel(membresiasCliente, (m) => textoMembresia(m, campo))}>
              {{ plan: 'Plan', vigencia: 'Vigencia', precio: 'Precio', estado: 'Estado' }[campo]}
            </FilterHeaderCell>)}
            <TableCell align="right">Acciones</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {membresiasFiltradas.slice((paginaMembresia - 1) * porPaginaMembresia, paginaMembresia * porPaginaMembresia).map((m) => <TableRow key={m.id} hover>
              <TableCell><Typography variant="body2" fontWeight={600}>{m.plan_nombre || '—'}</Typography>
                {m.modalidad_nombre && <Typography variant="caption" color="text.secondary">{m.modalidad_nombre}</Typography>}</TableCell>
              <TableCell>{textoMembresia(m, 'vigencia')}</TableCell>
              <TableCell>{textoMembresia(m, 'precio')}</TableCell>
              <TableCell><StatusChip estado={String(m.estado || '').toLowerCase()} /></TableCell>
              <TableCell align="right">
                <Tooltip title="Editar membresía"><IconButton sx={dbanuStyles.actionEdit} onClick={() => handleEditarMembresia(m)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                <Tooltip title="Eliminar membresía"><IconButton sx={dbanuStyles.actionDelete} onClick={() => handleEliminarMembresia(m)}><DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
              </TableCell>
            </TableRow>)}
            {!membresiasFiltradas.length && !cargandoFicha && <TableRow><TableCell colSpan={5} align="center">No se encontraron membresías.</TableCell></TableRow>}
          </TableBody>
        </TablaGestion>
      </Box>}
    </Stack>
  );

  // --- Progreso físico (dentro de la ficha del cliente) ---

  const handleProgresoChange = (e) => {
    const { name, value } = e.target;
    setProgresoForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoProgreso = () => {
    setProgresoForm(getInitialProgreso());
  };

  const handleEditarProgreso = (p) => {
    setProgresoForm({
      ...p,
      fecha_registro: limpiarFechaProgreso(p.fecha_registro),
      peso_kg: p.peso_kg ?? '',
      talla_cm: p.talla_cm ?? '',
      cintura_cm: p.cintura_cm ?? '',
      grasa_corporal_pct: p.grasa_corporal_pct ?? '',
    });
  };

  const handleGuardarProgreso = async () => {
    try {
      if (!progresoForm.fecha_registro) {
        showNotificacion('La fecha de registro es obligatoria', 'warning');
        return;
      }
      if (!progresoForm.peso_kg && !progresoForm.talla_cm && !progresoForm.cintura_cm && !progresoForm.grasa_corporal_pct) {
        showNotificacion('Registra al menos una medida (peso, talla, cintura o % grasa)', 'warning');
        return;
      }

      const payload = {
        ...progresoForm,
        cliente_id: formData.id,
      };
      ['peso_kg', 'talla_cm', 'cintura_cm', 'grasa_corporal_pct'].forEach((campo) => {
        if (payload[campo] === '') delete payload[campo];
      });
      if (!payload.objetivo) delete payload.objetivo;
      if (!payload.observaciones) delete payload.observaciones;

      if (progresoForm.id) {
        await entrenamientoServicio.actualizarProgreso(progresoForm.id, payload);
        showNotificacion('Progreso actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearProgreso(payload);
        showNotificacion('Progreso registrado con éxito', 'success');
      }

      setProgresoForm(getInitialProgreso());
      cargarProgresoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el progreso';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleEliminarProgreso = async (p) => {
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar registro de progreso',
      texto: `¿Estás seguro que deseas eliminar el registro del ${fechaProgreso(p.fecha_registro)}?`,
      textoConfirmar: 'Sí, eliminar',
      icono: 'warning',
    });

    if (!confirmado) return;

    try {
      await entrenamientoServicio.eliminarProgreso(p.id);
      showNotificacion('Registro eliminado con éxito', 'success');
      if (progresoForm.id === p.id) setProgresoForm(getInitialProgreso());
      cargarProgresoCliente(formData.id);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al eliminar el registro', 'error');
    }
  };

  const renderProgreso = () => {
    const imcPreview = calcularImcPreview(progresoForm.peso_kg, progresoForm.talla_cm);
    const estado = estadoImc(imcPreview);

    return (
      <Stack spacing={2}>
        <Box sx={formStyles.seccion}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>
              {progresoForm.id ? 'Editar registro' : 'Nuevo registro de progreso'}
            </Typography>
            {progresoForm.id ? (
              <Button size="small" onClick={handleNuevoProgreso}>Cancelar edición</Button>
            ) : null}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            <TextField label="Fecha de registro" name="fecha_registro" type="date" value={progresoForm.fecha_registro || ''} onChange={handleProgresoChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Peso (kg)" name="peso_kg" type="number" value={progresoForm.peso_kg || ''} onChange={handleProgresoChange} size="small" />
            <TextField label="Talla (cm)" name="talla_cm" type="number" value={progresoForm.talla_cm || ''} onChange={handleProgresoChange} size="small" />
            <TextField label="Cintura (cm)" name="cintura_cm" type="number" value={progresoForm.cintura_cm || ''} onChange={handleProgresoChange} size="small" />
            <TextField
              label="% Grasa corporal"
              name="grasa_corporal_pct"
              type="number"
              value={progresoForm.grasa_corporal_pct || ''}
              onChange={handleProgresoChange}
              size="small"
              helperText={imcPreview ? `IMC estimado: ${imcPreview.toFixed(1)} (${estado.label})` : ''}
            />
            <TextField label="Objetivo" name="objetivo" value={progresoForm.objetivo || ''} onChange={handleProgresoChange} size="small" />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <TextField label="Observaciones" name="observaciones" value={progresoForm.observaciones || ''} onChange={handleProgresoChange} size="small" fullWidth multiline minRows={2} />
          </Box>
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <BotonGuardar texto={progresoForm.id ? 'Guardar cambios' : 'Guardar registro'} onClick={handleGuardarProgreso} />
          </Stack>
        </Box>

        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Historial de progreso</Typography>
          {cargandoFicha ? (
            <Typography variant="body2" color="text.secondary">Cargando...</Typography>
          ) : progresosCliente.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Este cliente no tiene registros de progreso todavía.</Typography>
          ) : (
            <Stack spacing={1}>
              {progresosCliente.map((p) => {
                const estadoFila = estadoImc(p.imc);
                return (
                  <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary">{fechaProgreso(p.fecha_registro)}</Typography>
                      <Typography variant="body2" fontWeight="500">{p.peso_kg ? `${Number(p.peso_kg).toFixed(1)} kg` : 'Sin peso'}</Typography>
                      {p.imc ? <Chip label={`IMC ${Number(p.imc).toFixed(1)} · ${estadoFila.label}`} size="small" color={estadoFila.color} /> : null}
                      {p.grasa_corporal_pct ? <Typography variant="body2" color="text.secondary">{Number(p.grasa_corporal_pct).toFixed(1)}% grasa</Typography> : null}
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Editar registro">
                        <IconButton size="small" onClick={() => handleEditarProgreso(p)}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar registro">
                        <IconButton size="small" sx={dbanuStyles.actionDelete} onClick={() => handleEliminarProgreso(p)}>
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    );
  };


  // --- Entrenamiento (plan + rutinas + RM, dentro de la ficha del cliente) ---

  const handlePlanEntrenamientoChange = (e) => {
    const { name, value } = e.target;
    setPlanEntrenamientoForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoPlanEntrenamiento = () => {
    setPlanEntrenamientoForm(getInitialPlanEntrenamiento());
  };

  const handleEditarPlanEntrenamiento = (p) => {
    setPlanEntrenamientoForm({
      ...p,
      fecha_inicio: limpiarFechaPlan(p.fecha_inicio),
      fecha_fin: limpiarFechaPlan(p.fecha_fin),
    });
  };

  const handleGuardarPlanEntrenamiento = async () => {
    try {
      if (!planEntrenamientoForm.nombre || !planEntrenamientoForm.fecha_inicio) {
        showNotificacion('Completa los campos obligatorios del plan', 'warning');
        return;
      }

      const payload = {
        ...planEntrenamientoForm,
        cliente_id: formData.id,
      };
      if (!payload.entrenador_id) delete payload.entrenador_id;
      if (!payload.fecha_fin) delete payload.fecha_fin;
      if (!payload.objetivo) delete payload.objetivo;
      if (!payload.observaciones) delete payload.observaciones;

      if (planEntrenamientoForm.id) {
        await entrenamientoServicio.actualizarPlan(planEntrenamientoForm.id, payload);
        showNotificacion('Plan actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearPlan(payload);
        showNotificacion('Plan creado con éxito', 'success');
      }

      setPlanEntrenamientoForm(getInitialPlanEntrenamiento());
      cargarEntrenamientoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el plan';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleSeleccionarPlan = async (plan) => {
    setPlanSeleccionadoId(plan.id);
    setRutinaForm({ ...getInitialRutina(), plan_id: plan.id });
    try {
      const response = await entrenamientoServicio.obtenerRutinas({ plan_id: plan.id, per_page: 100 });
      setRutinasPlan(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar las rutinas del plan', 'error');
    }
  };

  const handleRutinaChange = (e) => {
    const { name, value } = e.target;
    setRutinaForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevaRutina = () => {
    setRutinaForm({ ...getInitialRutina(), plan_id: planSeleccionadoId });
  };

  const handleEditarRutina = (r) => {
    setRutinaForm({ ...r });
  };

  const handleGuardarRutina = async () => {
    try {
      if (!rutinaForm.ejercicio_id || !rutinaForm.dia || !rutinaForm.series || !rutinaForm.orden) {
        showNotificacion('Completa los campos obligatorios de la rutina', 'warning');
        return;
      }

      const payload = {
        ...rutinaForm,
        plan_id: planSeleccionadoId,
        semana: Number(rutinaForm.semana || 1),
        series: Number(rutinaForm.series || 1),
        orden: Number(rutinaForm.orden || 1),
        carga_objetivo: rutinaForm.carga_objetivo ? Number(rutinaForm.carga_objetivo) : null,
        descanso_segundos: rutinaForm.descanso_segundos ? Number(rutinaForm.descanso_segundos) : null,
      };
      if (!payload.bloque) delete payload.bloque;
      if (!payload.repeticiones) delete payload.repeticiones;
      if (!payload.notas) delete payload.notas;
      if (payload.carga_objetivo === null) delete payload.carga_objetivo;
      if (payload.descanso_segundos === null) delete payload.descanso_segundos;

      if (rutinaForm.id) {
        await entrenamientoServicio.actualizarRutina(rutinaForm.id, payload);
        showNotificacion('Rutina actualizada con éxito', 'success');
      } else {
        await entrenamientoServicio.crearRutina(payload);
        showNotificacion('Rutina creada con éxito', 'success');
      }

      setRutinaForm({ ...getInitialRutina(), plan_id: planSeleccionadoId });
      const response = await entrenamientoServicio.obtenerRutinas({ plan_id: planSeleccionadoId, per_page: 100 });
      setRutinasPlan(response.datos || []);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar la rutina';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleRmChange = (e) => {
    const { name, value } = e.target;
    setRmForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoRm = () => {
    setRmForm(getInitialRm());
  };

  const handleEditarRm = (r) => {
    setRmForm({
      ...r,
      fecha_registro: limpiarFechaRm(r.fecha_registro),
    });
  };

  const handleGuardarRm = async () => {
    try {
      if (!rmForm.ejercicio_id || !rmForm.peso || !rmForm.fecha_registro || (rmForm.tipo_registro === 'ESTIMADO' && !rmForm.repeticiones)) {
        showNotificacion('Completa los campos obligatorios del registro RM', 'warning');
        return;
      }

      const payload = {
        ...rmForm,
        cliente_id: formData.id,
        peso: Number(rmForm.peso),
        rm_estimado: undefined,
        repeticiones: rmForm.repeticiones ? Number(rmForm.repeticiones) : null,
      };
      if (payload.repeticiones === null) delete payload.repeticiones;
      if (!payload.observaciones) delete payload.observaciones;

      if (rmForm.id) {
        await entrenamientoServicio.actualizarRegistroRm(rmForm.id, payload);
        showNotificacion('Registro RM actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearRegistroRm(payload);
        showNotificacion('Registro RM guardado con éxito', 'success');
      }

      setRmForm(getInitialRm());
      cargarEntrenamientoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el registro RM';
      showNotificacion(mensaje, 'error');
    }
  };

  const renderEntrenamiento = () => (
    <Stack spacing={2}>
      <PruebasRendimientoDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />
      <Box sx={formStyles.seccion}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {planEntrenamientoForm.id ? 'Editar plan' : 'Nuevo plan de entrenamiento'}
          </Typography>
          {planEntrenamientoForm.id ? (
            <Button size="small" onClick={handleNuevoPlanEntrenamiento}>Cancelar edición</Button>
          ) : null}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField label="Nombre del plan" name="nombre" value={planEntrenamientoForm.nombre || ''} onChange={handlePlanEntrenamientoChange} required size="small" />
          <TextField select label="Entrenador" name="entrenador_id" value={planEntrenamientoForm.entrenador_id || ''} onChange={handlePlanEntrenamientoChange} size="small">
            <MenuItem value="">Sin asignar</MenuItem>
            {entrenadoresDisp.map((ent) => (
              <MenuItem key={ent.usuario_id} value={ent.usuario_id}>{`${ent.nombres || ''} ${ent.apellidos || ''}`.trim() || ent.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Estado" name="estado" value={planEntrenamientoForm.estado || 'BORRADOR'} onChange={handlePlanEntrenamientoChange} required size="small">
            <MenuItem value="BORRADOR">Borrador</MenuItem>
            <MenuItem value="ACTIVO">Activo</MenuItem>
            <MenuItem value="PAUSADO">Pausado</MenuItem>
            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
          </TextField>
          <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={planEntrenamientoForm.fecha_inicio || ''} onChange={handlePlanEntrenamientoChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Fecha fin" name="fecha_fin" type="date" value={planEntrenamientoForm.fecha_fin || ''} onChange={handlePlanEntrenamientoChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Objetivo" name="objetivo" value={planEntrenamientoForm.objetivo || ''} onChange={handlePlanEntrenamientoChange} size="small" />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <TextField label="Observaciones" name="observaciones" value={planEntrenamientoForm.observaciones || ''} onChange={handlePlanEntrenamientoChange} size="small" fullWidth multiline minRows={2} />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto={planEntrenamientoForm.id ? 'Guardar cambios' : 'Guardar plan'} onClick={handleGuardarPlanEntrenamiento} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Planes del cliente</Typography>
        {planesEntrenamiento.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene planes de entrenamiento todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {planesEntrenamiento.map((p) => (
              <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: p.id === planSeleccionadoId ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: 2, p: 1.25, cursor: 'pointer' }}
                onClick={() => handleSeleccionarPlan(p)}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Chip label={p.estado} size="small" />
                  <Typography variant="body2" fontWeight="500">{p.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">{fechaPlan(p.fecha_inicio)} - {p.fecha_fin ? fechaPlan(p.fecha_fin) : 'Sin fin'}</Typography>
                  {p.entrenador_nombre ? <Typography variant="body2" color="text.secondary">Entrenador: {p.entrenador_nombre}</Typography> : null}
                </Stack>
                <Tooltip title="Editar plan">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditarPlanEntrenamiento(p); }}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      {planSeleccionadoId ? (
        <Box sx={formStyles.seccion}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>
              {rutinaForm.id ? 'Editar rutina' : 'Nueva rutina'} — {planesEntrenamiento.find((p) => p.id === planSeleccionadoId)?.nombre}
            </Typography>
            {rutinaForm.id ? (
              <Button size="small" onClick={handleNuevaRutina}>Cancelar edición</Button>
            ) : null}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            <TextField select label="Ejercicio" name="ejercicio_id" value={rutinaForm.ejercicio_id || ''} onChange={handleRutinaChange} required size="small">
              {ejerciciosDisp.map((ej) => (
                <MenuItem key={ej.id} value={ej.id}>{ej.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Día" name="dia" value={rutinaForm.dia || 'LUNES'} onChange={handleRutinaChange} required size="small">
              {DIAS_SEMANA.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField label="Semana" name="semana" type="number" value={rutinaForm.semana || 1} onChange={handleRutinaChange} required size="small" />
            <TextField label="Bloque" name="bloque" value={rutinaForm.bloque || ''} onChange={handleRutinaChange} size="small" />
            <TextField label="Series" name="series" type="number" value={rutinaForm.series || 1} onChange={handleRutinaChange} required size="small" />
            <TextField label="Repeticiones" name="repeticiones" value={rutinaForm.repeticiones || ''} onChange={handleRutinaChange} size="small" />
            <TextField select label="Tipo carga" name="tipo_carga" value={rutinaForm.tipo_carga || 'LIBRE'} onChange={handleRutinaChange} required size="small">
              {TIPOS_CARGA.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField
              label={rutinaForm.tipo_carga === 'PORCENTAJE_RM' ? 'Carga objetivo (%)' : 'Carga objetivo'}
              name="carga_objetivo"
              type="number"
              value={rutinaForm.carga_objetivo || ''}
              onChange={handleRutinaChange}
              size="small"
              helperText={(() => {
                const sugerido = pesoSugeridoPorPorcentaje(rutinaForm, ultimosRm);
                return sugerido ? `Peso sugerido: ${sugerido.toFixed(1)} (último RM: ${Number(ultimosRm[rutinaForm.ejercicio_id]?.rm_estimado).toFixed(1)})` : '';
              })()}
            />
            <TextField label="Descanso (seg)" name="descanso_segundos" type="number" value={rutinaForm.descanso_segundos || ''} onChange={handleRutinaChange} size="small" />
            <TextField label="Orden" name="orden" type="number" value={rutinaForm.orden || 1} onChange={handleRutinaChange} required size="small" />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <TextField label="Notas" name="notas" value={rutinaForm.notas || ''} onChange={handleRutinaChange} size="small" fullWidth multiline minRows={2} />
          </Box>
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <BotonGuardar texto={rutinaForm.id ? 'Guardar cambios' : 'Guardar rutina'} onClick={handleGuardarRutina} />
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>Rutinas del plan</Typography>
            {rutinasPlan.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Este plan no tiene rutinas todavía.</Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {rutinasPlan.map((r) => {
                  const sugerido = pesoSugeridoPorPorcentaje(r, ultimosRm);
                  return (
                    <Stack key={r.id} direction="row" alignItems="center" justifyContent="space-between"
                      sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Chip label={`Sem ${r.semana} · ${r.dia}`} size="small" />
                        <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.series} series{r.repeticiones ? ` x ${r.repeticiones}` : ''}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.carga_objetivo ? `${r.carga_objetivo} ${r.tipo_carga}` : r.tipo_carga}</Typography>
                        {sugerido ? <Chip label={`Sugerido: ${sugerido.toFixed(1)}`} size="small" color="info" /> : null}
                      </Stack>
                      <Tooltip title="Editar rutina">
                        <IconButton size="small" onClick={() => handleEditarRutina(r)}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      ) : null}

      <Box sx={formStyles.seccion}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {rmForm.id ? 'Editar registro RM' : 'Nuevo registro RM'}
          </Typography>
          {rmForm.id ? (
            <Button size="small" onClick={handleNuevoRm}>Cancelar edición</Button>
          ) : null}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField select label="Ejercicio" name="ejercicio_id" value={rmForm.ejercicio_id || ''} onChange={handleRmChange} required size="small">
            {ejerciciosDisp.map((ej) => (
              <MenuItem key={ej.id} value={ej.id}>{ej.nombre}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Tipo registro" name="tipo_registro" value={rmForm.tipo_registro || 'ESTIMADO'} onChange={handleRmChange} required size="small">
            {TIPOS_RM.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Fecha de registro" name="fecha_registro" type="date" value={rmForm.fecha_registro || ''} onChange={handleRmChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Peso" name="peso" type="number" value={rmForm.peso || ''} onChange={handleRmChange} required size="small" />
          <TextField label="Repeticiones" name="repeticiones" type="number" value={rmForm.tipo_registro === 'DIRECTO' ? 1 : rmForm.repeticiones || ''} onChange={handleRmChange} size="small"
            disabled={rmForm.tipo_registro === 'DIRECTO'} required={rmForm.tipo_registro === 'ESTIMADO'}
            inputProps={{ min: 1, max: 10 }} helperText={rmForm.tipo_registro === 'ESTIMADO' ? '1 a 10 repeticiones · fórmula Epley' : 'Una repetición máxima real'} />
          <TextField label={rmForm.tipo_registro === 'DIRECTO' ? '1RM medida (kg)' : '1RM estimada (kg)'} size="small"
            value={rmForm.peso && rmForm.tipo_registro === 'DIRECTO' ? Number(rmForm.peso).toFixed(2) : rmForm.peso && Number(rmForm.repeticiones) >= 1 && Number(rmForm.repeticiones) <= 10 ? (Number(rmForm.peso) * (1 + Number(rmForm.repeticiones) / 30)).toFixed(2) : ''}
            InputProps={{ readOnly: true }} helperText="Cálculo definitivo validado por Laravel" />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <TextField label="Observaciones" name="observaciones" value={rmForm.observaciones || ''} onChange={handleRmChange} size="small" fullWidth multiline minRows={2} />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto={rmForm.id ? 'Guardar cambios' : 'Guardar registro RM'} onClick={handleGuardarRm} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Historial de RM</Typography>
        {rmCliente.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene registros de RM todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {rmCliente.map((r) => (
              <Stack key={r.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary">{fechaRm(r.fecha_registro)}</Typography>
                  <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                  <Chip label={`RM ${Number(r.rm_estimado).toFixed(1)}`} size="small" />
                  <Typography variant="body2" color="text.secondary">{r.tipo_registro}</Typography>
                </Stack>
                <Tooltip title="Editar registro">
                  <IconButton size="small" onClick={() => handleEditarRm(r)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo="Nuevo Cliente"
          descripcion="Registra los datos principales; luego podrás completar el resto de su ficha"
          icono={<PeopleAltOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelar} />}
        />

        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            {renderCamposDatos()}
          </Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={handleCancelar} guardando={guardandoCliente} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  if (vista === 'ficha') {
    const nombreCliente = `${formData.nombres || ''} ${formData.apellidos || ''}`.trim() || formData.usuario_nombre || formData.name || formData.codigo_deportista;
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={`Perfil integral de ${nombreCliente}`}
          descripcion="Consulta y administra su información personal, membresías, valoraciones, entrenamientos y seguimiento deportivo."
          icono={<PeopleAltOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelarFicha} />}
        />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          {formData.codigo_deportista && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 1.5 }}>
              <Chip size="small" variant="outlined" label={`Código cliente: ${formData.codigo_deportista}`} />
            </Box>
          )}
          <PestanasEstandar
            value={tabFicha}
            onChange={handleCambiarTabFicha}
            opciones={TABS_FICHA}
          />
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            {tabFicha === 'datos' && renderCamposDatos()}
            {tabFicha === 'ficha_inicial' && <FichaInicialDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />}
            {tabFicha === 'entrenador' && renderEntrenadorYHorario()}
            {tabFicha === 'membresia' && renderMembresia()}
            {tabFicha === 'progreso' && <InformeProgresoDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />}
            {tabFicha === 'entrenamiento' && renderEntrenamiento()}
          </Box>
          {tabFicha === 'datos' && (
            <Stack spacing={1.5}>
              <AccionesFormulario onGuardar={handleGuardarDatosFicha} onCancelar={handleCancelarFicha} textoCancelar="Volver a la lista" />
            </Stack>
          )}
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  // VISTA LISTA
  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Clientes"
        descripcion="Directorio principal de clientes y miembros del gimnasio"
        icono={<PeopleAltOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || deportistas.length}
          busqueda={filtros.busqueda}
          onBusqueda={(v) => buscar({ ...filtros, busqueda: v })}
          acciones={
            <Button
              startIcon={<AddOutlinedIcon />}
              onClick={handleNuevo}
              sx={dbanuStyles.addButtonRevive}
            >
              Añadir
            </Button>
          }
        />

        <DeportistasTable
          deportistas={deportistas}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onAbrirFicha={handleAbrirFicha}
          onPageChange={(p) => {
            const n = { ...filtros, page: p };
            setFiltros(n);
            cargarDeportistas(n);
          }}
          onRowsPerPageChange={(pp) => {
            const n = { ...filtros, page: 1, per_page: pp };
            setFiltros(n);
            cargarDeportistas(n);
          }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
    </Box>
  );
}
          {membresiaForm.id && !membresiaForm.cantidad_periodos_contratados ? (
          <Box
            sx={{
              height: 40,
              boxSizing: 'border-box',
              px: 1.25,
              border: '1px solid #dbe5f0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8fafc',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  name="renovacion_automatica"
                  checked={Boolean(membresiaForm.renovacion_automatica)}
                  onChange={handleMembresiaChange}
                  size="small"
                />
              }
              label="Renovación automática"
              sx={{ m: 0 }}
            />
          </Box>

          ) : null}
          {membresiaForm.id && !membresiaForm.cantidad_periodos_contratados ? (
          <Box
            sx={{
              height: 40,
              boxSizing: 'border-box',
              px: 1.25,
              border: '1px solid #dbe5f0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8fafc',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  name="congelar_membresia"
                  checked={Boolean(membresiaForm.congelar_membresia)}
                  onChange={handleMembresiaChange}
                  size="small"
                />
              }
              label="Congelar membresía"
              sx={{ m: 0 }}
            />
          </Box>
          ) : null}
        </Box>

        <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid #dbe5f0', borderRadius: 1.5, bgcolor: '#fafbfc' }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Sedes autorizadas para ingresar *</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Selecciona una o varias sedes a las que podrá ingresar con esta membresía.
            En los pases diarios, la tarifa se calcula según la sede donde se realice el cobro.
          </Typography>
          <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
            {sedes.map((sede) => {
              const seleccionada = (membresiaForm.sedes_habilitadas || [])
                .some((id) => String(id) === String(sede.id_sede));
              return (
                <Button key={sede.id_sede} type="button"
                  variant={seleccionada ? 'contained' : 'outlined'}
                  aria-pressed={seleccionada}
                  startIcon={seleccionada ? <CheckRoundedIcon sx={{ fontSize: 19 }} /> : <LocationCityOutlinedIcon sx={{ fontSize: 19 }} />}
                  onClick={() => setMembresiaForm((actual) => {
                    const anteriores = (actual.sedes_habilitadas || []).map(Number).filter(Boolean);
                    const id = Number(sede.id_sede);
                    const nuevas = anteriores.includes(id)
                      ? anteriores.filter((valor) => valor !== id)
                      : Array.from(new Set([...anteriores, id]));
                    if (!nuevas.length) {
                      showNotificacion('Debes habilitar al menos una sede para la membresía.', 'warning');
                      return actual;
                    }
                    const sedePrincipal = nuevas.includes(Number(actual.sede_id))
                      ? Number(actual.sede_id)
                      : nuevas[0];
                    return { ...actual, sede_id: sedePrincipal, sedes_habilitadas: nuevas };
                  })}
                  sx={{
                    textTransform: 'none', fontSize: 13, fontWeight: 800,
                    minHeight: 42, minWidth: 145, px: 2, borderRadius: 1.7,
                    boxShadow: seleccionada ? '0 2px 5px rgba(155, 111, 0, 0.16)' : 'none',
                    border: '1px solid', borderColor: seleccionada ? '#d3a018' : '#dbe5f0',
                    bgcolor: seleccionada ? '#d4a017' : '#fff',
                    color: seleccionada ? '#14243c' : '#475467',
                    '&:hover': {
                      bgcolor: seleccionada ? '#bd8e0f' : '#fff8e5',
                      borderColor: '#d4a017',
                      boxShadow: seleccionada ? '0 3px 8px rgba(155, 111, 0, 0.2)' : 'none',
                    },
                    '&:focus-visible': { outline: '2px solid #14243c', outlineOffset: 2 },
                  }}
                >
                  {sede.nombre}
                </Button>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ mt: 1.25, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>
            Configuración comercial
          </Typography>
          {membresiaForm.plan_id && String(planMembresiaSeleccionado?.tipo_producto || 'MEMBRESIA').toUpperCase() !== 'PASE_DIARIO' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {planMembresiaSeleccionado?.generar_venta && planMembresiaSeleccionado?.requiere_pago
                ? 'Venta inicial pendiente de cobro'
                : 'Sin venta inicial automática'}
            </Typography>
          )}
          {permiteCobroProgramado && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 1.5 }}>
              <TextField fullWidth size="small" label="Día de pago" name="dia_pago" type="number"
                value={membresiaForm.dia_pago ?? ''} onChange={handleMembresiaChange}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, max: 31 } }} />
              <TextField fullWidth size="small" label="Próximo cobro"
                value={proximoCobroPreview || 'Automático'}
                slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }} />
              <Box sx={{ minHeight: 40, px: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                <FormControlLabel control={<Switch size="small" name="generar_venta_automatica"
                  checked={Boolean(membresiaForm.generar_venta_automatica)} onChange={handleMembresiaChange} />}
                  label="Renovaciones automáticas" sx={{ m: 0 }} />
              </Box>
            </Box>
          )}
          <FormControlLabel sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 700 } }}
            control={<Switch size="small" checked={requiereDescuento}
              onChange={(e) => setRequiereDescuento(e.target.checked)} />}
            label="Aplicar descuento" />
          {requiereDescuento && (
            <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
              <TextField fullWidth size="small" select label="Tipo de descuento" value={descuentoMembresia.tipo}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, tipo: e.target.value }))}>
                <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
                <MenuItem value="FIJO">Valor fijo ($)</MenuItem>
              </TextField>
              <TextField fullWidth size="small" type="number" label="Descuento" value={descuentoMembresia.valor}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, valor: e.target.value }))}
                error={false}
                sx={descuentoInvalido ? {
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d89b25 !important', borderWidth: 1.5 },
                  '& .MuiFormHelperText-root': { color: '#996515' },
                } : undefined}
                helperText={descuentoInvalido
                  ? descuentoMembresia.tipo === 'FIJO'
                    ? `Máximo permitido: ${precioBaseResumen.toFixed(2)}`
                    : 'Ingresa un porcentaje entre 0 y 100.'
                  : descuentoMembresia.tipo === 'FIJO' && precioMembresiaPreview !== null
                    ? `Hasta ${precioBaseResumen.toFixed(2)}`
                    : ''}
                slotProps={{ htmlInput: { min: 0.01, max: descuentoMembresia.tipo === 'PORCENTAJE' ? 100 : (precioMembresiaPreview ?? undefined), step: 0.01 } }} />
              <TextField fullWidth size="small" label="Motivo / autorización" value={descuentoMembresia.motivo}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, motivo: e.target.value }))} />
              <TextField fullWidth size="small" type="date" label="Desde"
                value={descuentoMembresia.fecha_inicio || membresiaForm.fecha_inicio || ''}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, fecha_inicio: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth size="small" type="date" label="Hasta (opcional)" value={descuentoMembresia.fecha_fin}
                onChange={(e) => setDescuentoMembresia((a) => ({ ...a, fecha_fin: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
          )}
          {precioMembresiaPreview !== null && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2,
              px: 1.5, py: 1.15, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="body2">Precio: <strong>${precioBaseResumen.toFixed(2)}</strong></Typography>
              <Typography variant="body2">Descuento: <strong>${importeDescuentoPreview.toFixed(2)}</strong></Typography>
              <Typography variant="body2" sx={{ color: descuentoInvalido ? '#996515' : 'success.dark', fontWeight: 800 }}>
                {descuentoInvalido
                  ? 'Corrige el descuento para calcular el total'
                  : `Total a pagar: ${Math.max(0, precioBaseResumen - importeDescuentoPreview).toFixed(2)}`}
              </Typography>
            </Box>
          )}
        </Box>

        {membresiaForm.congelar_membresia ? (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              border: '1px solid #dbe5f0',
              borderRadius: 1.5,
              bgcolor: '#fbfdff',
            }}
          >
            <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>
              Período de congelación
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
              <TextField
                label="Desde"
                name="fecha_congelacion_inicio"
                type="date"
                value={membresiaForm.fecha_congelacion_inicio || ''}
                onChange={handleMembresiaChange}
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Hasta"
                name="fecha_congelacion_fin"
                type="date"
                value={membresiaForm.fecha_congelacion_fin || ''}
                onChange={handleMembresiaChange}
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              La congelación pausa temporalmente la membresía; no equivale a días de gracia ni a cancelación.
            </Typography>
          </Box>
        ) : null}
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar onClick={handleGuardarMembresia} />
        </Stack>
      </Box> : null}
      {vistaMembresia === 'listado' && <Box sx={formStyles.seccion}>
        <GestionToolbar total={membresiasFiltradas.length} busqueda={buscarMembresia}
          onBusqueda={(valor) => { setBuscarMembresia(valor); setPaginaMembresia(1); }}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={handleNuevaMembresia}>Añadir</Button>} />
        <TablaGestion total={membresiasCliente.length} filtrados={membresiasFiltradas.length}
          cargando={cargandoFicha} page={paginaMembresia} rowsPerPage={porPaginaMembresia}
          onPageChange={setPaginaMembresia} onRowsPerPageChange={(numero) => { setPorPaginaMembresia(numero); setPaginaMembresia(1); }}>
          <TableHead><TableRow>
            {['plan','vigencia','precio','estado'].map((campo) => <FilterHeaderCell key={campo}
              value={filtrosMembresia[campo]} onChange={(valores) => filtrarMembresia(campo, valores)}
              options={opcionesExcel(membresiasCliente, (m) => textoMembresia(m, campo))}>
              {{ plan: 'Plan', vigencia: 'Vigencia', precio: 'Precio', estado: 'Estado' }[campo]}
            </FilterHeaderCell>)}
            <TableCell align="right">Acciones</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {membresiasFiltradas.slice((paginaMembresia - 1) * porPaginaMembresia, paginaMembresia * porPaginaMembresia).map((m) => <TableRow key={m.id} hover>
              <TableCell><Typography variant="body2" fontWeight={600}>{m.plan_nombre || '—'}</Typography>
                {m.modalidad_nombre && <Typography variant="caption" color="text.secondary">{m.modalidad_nombre}</Typography>}</TableCell>
              <TableCell>{textoMembresia(m, 'vigencia')}</TableCell>
              <TableCell>{textoMembresia(m, 'precio')}</TableCell>
              <TableCell><StatusChip estado={String(m.estado || '').toLowerCase()} /></TableCell>
              <TableCell align="right">
                <Tooltip title="Editar membresía"><IconButton sx={dbanuStyles.actionEdit} onClick={() => handleEditarMembresia(m)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                <Tooltip title="Eliminar membresía"><IconButton sx={dbanuStyles.actionDelete} onClick={() => handleEliminarMembresia(m)}><DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
              </TableCell>
            </TableRow>)}
            {!membresiasFiltradas.length && !cargandoFicha && <TableRow><TableCell colSpan={5} align="center">No se encontraron membresías.</TableCell></TableRow>}
          </TableBody>
        </TablaGestion>
      </Box>}
    </Stack>
  );

  // --- Progreso físico (dentro de la ficha del cliente) ---

  const handleProgresoChange = (e) => {
    const { name, value } = e.target;
    setProgresoForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoProgreso = () => {
    setProgresoForm(getInitialProgreso());
  };

  const handleEditarProgreso = (p) => {
    setProgresoForm({
      ...p,
      fecha_registro: limpiarFechaProgreso(p.fecha_registro),
      peso_kg: p.peso_kg ?? '',
      talla_cm: p.talla_cm ?? '',
      cintura_cm: p.cintura_cm ?? '',
      grasa_corporal_pct: p.grasa_corporal_pct ?? '',
    });
  };

  const handleGuardarProgreso = async () => {
    try {
      if (!progresoForm.fecha_registro) {
        showNotificacion('La fecha de registro es obligatoria', 'warning');
        return;
      }
      if (!progresoForm.peso_kg && !progresoForm.talla_cm && !progresoForm.cintura_cm && !progresoForm.grasa_corporal_pct) {
        showNotificacion('Registra al menos una medida (peso, talla, cintura o % grasa)', 'warning');
        return;
      }

      const payload = {
        ...progresoForm,
        cliente_id: formData.id,
      };
      ['peso_kg', 'talla_cm', 'cintura_cm', 'grasa_corporal_pct'].forEach((campo) => {
        if (payload[campo] === '') delete payload[campo];
      });
      if (!payload.objetivo) delete payload.objetivo;
      if (!payload.observaciones) delete payload.observaciones;

      if (progresoForm.id) {
        await entrenamientoServicio.actualizarProgreso(progresoForm.id, payload);
        showNotificacion('Progreso actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearProgreso(payload);
        showNotificacion('Progreso registrado con éxito', 'success');
      }

      setProgresoForm(getInitialProgreso());
      cargarProgresoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el progreso';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleEliminarProgreso = async (p) => {
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar registro de progreso',
      texto: `¿Estás seguro que deseas eliminar el registro del ${fechaProgreso(p.fecha_registro)}?`,
      textoConfirmar: 'Sí, eliminar',
      icono: 'warning',
    });

    if (!confirmado) return;

    try {
      await entrenamientoServicio.eliminarProgreso(p.id);
      showNotificacion('Registro eliminado con éxito', 'success');
      if (progresoForm.id === p.id) setProgresoForm(getInitialProgreso());
      cargarProgresoCliente(formData.id);
    } catch (error) {
      showNotificacion(error.response?.data?.mensaje || 'Error al eliminar el registro', 'error');
    }
  };

  const renderProgreso = () => {
    const imcPreview = calcularImcPreview(progresoForm.peso_kg, progresoForm.talla_cm);
    const estado = estadoImc(imcPreview);

    return (
      <Stack spacing={2}>
        <Box sx={formStyles.seccion}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>
              {progresoForm.id ? 'Editar registro' : 'Nuevo registro de progreso'}
            </Typography>
            {progresoForm.id ? (
              <Button size="small" onClick={handleNuevoProgreso}>Cancelar edición</Button>
            ) : null}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            <TextField label="Fecha de registro" name="fecha_registro" type="date" value={progresoForm.fecha_registro || ''} onChange={handleProgresoChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Peso (kg)" name="peso_kg" type="number" value={progresoForm.peso_kg || ''} onChange={handleProgresoChange} size="small" />
            <TextField label="Talla (cm)" name="talla_cm" type="number" value={progresoForm.talla_cm || ''} onChange={handleProgresoChange} size="small" />
            <TextField label="Cintura (cm)" name="cintura_cm" type="number" value={progresoForm.cintura_cm || ''} onChange={handleProgresoChange} size="small" />
            <TextField
              label="% Grasa corporal"
              name="grasa_corporal_pct"
              type="number"
              value={progresoForm.grasa_corporal_pct || ''}
              onChange={handleProgresoChange}
              size="small"
              helperText={imcPreview ? `IMC estimado: ${imcPreview.toFixed(1)} (${estado.label})` : ''}
            />
            <TextField label="Objetivo" name="objetivo" value={progresoForm.objetivo || ''} onChange={handleProgresoChange} size="small" />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <TextField label="Observaciones" name="observaciones" value={progresoForm.observaciones || ''} onChange={handleProgresoChange} size="small" fullWidth multiline minRows={2} />
          </Box>
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <BotonGuardar texto={progresoForm.id ? 'Guardar cambios' : 'Guardar registro'} onClick={handleGuardarProgreso} />
          </Stack>
        </Box>

        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Historial de progreso</Typography>
          {cargandoFicha ? (
            <Typography variant="body2" color="text.secondary">Cargando...</Typography>
          ) : progresosCliente.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Este cliente no tiene registros de progreso todavía.</Typography>
          ) : (
            <Stack spacing={1}>
              {progresosCliente.map((p) => {
                const estadoFila = estadoImc(p.imc);
                return (
                  <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary">{fechaProgreso(p.fecha_registro)}</Typography>
                      <Typography variant="body2" fontWeight="500">{p.peso_kg ? `${Number(p.peso_kg).toFixed(1)} kg` : 'Sin peso'}</Typography>
                      {p.imc ? <Chip label={`IMC ${Number(p.imc).toFixed(1)} · ${estadoFila.label}`} size="small" color={estadoFila.color} /> : null}
                      {p.grasa_corporal_pct ? <Typography variant="body2" color="text.secondary">{Number(p.grasa_corporal_pct).toFixed(1)}% grasa</Typography> : null}
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Editar registro">
                        <IconButton size="small" onClick={() => handleEditarProgreso(p)}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar registro">
                        <IconButton size="small" sx={dbanuStyles.actionDelete} onClick={() => handleEliminarProgreso(p)}>
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    );
  };


  // --- Entrenamiento (plan + rutinas + RM, dentro de la ficha del cliente) ---

  const handlePlanEntrenamientoChange = (e) => {
    const { name, value } = e.target;
    setPlanEntrenamientoForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoPlanEntrenamiento = () => {
    setPlanEntrenamientoForm(getInitialPlanEntrenamiento());
  };

  const handleEditarPlanEntrenamiento = (p) => {
    setPlanEntrenamientoForm({
      ...p,
      fecha_inicio: limpiarFechaPlan(p.fecha_inicio),
      fecha_fin: limpiarFechaPlan(p.fecha_fin),
    });
  };

  const handleGuardarPlanEntrenamiento = async () => {
    try {
      if (!planEntrenamientoForm.nombre || !planEntrenamientoForm.fecha_inicio) {
        showNotificacion('Completa los campos obligatorios del plan', 'warning');
        return;
      }

      const payload = {
        ...planEntrenamientoForm,
        cliente_id: formData.id,
      };
      if (!payload.entrenador_id) delete payload.entrenador_id;
      if (!payload.fecha_fin) delete payload.fecha_fin;
      if (!payload.objetivo) delete payload.objetivo;
      if (!payload.observaciones) delete payload.observaciones;

      if (planEntrenamientoForm.id) {
        await entrenamientoServicio.actualizarPlan(planEntrenamientoForm.id, payload);
        showNotificacion('Plan actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearPlan(payload);
        showNotificacion('Plan creado con éxito', 'success');
      }

      setPlanEntrenamientoForm(getInitialPlanEntrenamiento());
      cargarEntrenamientoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el plan';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleSeleccionarPlan = async (plan) => {
    setPlanSeleccionadoId(plan.id);
    setRutinaForm({ ...getInitialRutina(), plan_id: plan.id });
    try {
      const response = await entrenamientoServicio.obtenerRutinas({ plan_id: plan.id, per_page: 100 });
      setRutinasPlan(response.datos || []);
    } catch (error) {
      showNotificacion('Error al cargar las rutinas del plan', 'error');
    }
  };

  const handleRutinaChange = (e) => {
    const { name, value } = e.target;
    setRutinaForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevaRutina = () => {
    setRutinaForm({ ...getInitialRutina(), plan_id: planSeleccionadoId });
  };

  const handleEditarRutina = (r) => {
    setRutinaForm({ ...r });
  };

  const handleGuardarRutina = async () => {
    try {
      if (!rutinaForm.ejercicio_id || !rutinaForm.dia || !rutinaForm.series || !rutinaForm.orden) {
        showNotificacion('Completa los campos obligatorios de la rutina', 'warning');
        return;
      }

      const payload = {
        ...rutinaForm,
        plan_id: planSeleccionadoId,
        semana: Number(rutinaForm.semana || 1),
        series: Number(rutinaForm.series || 1),
        orden: Number(rutinaForm.orden || 1),
        carga_objetivo: rutinaForm.carga_objetivo ? Number(rutinaForm.carga_objetivo) : null,
        descanso_segundos: rutinaForm.descanso_segundos ? Number(rutinaForm.descanso_segundos) : null,
      };
      if (!payload.bloque) delete payload.bloque;
      if (!payload.repeticiones) delete payload.repeticiones;
      if (!payload.notas) delete payload.notas;
      if (payload.carga_objetivo === null) delete payload.carga_objetivo;
      if (payload.descanso_segundos === null) delete payload.descanso_segundos;

      if (rutinaForm.id) {
        await entrenamientoServicio.actualizarRutina(rutinaForm.id, payload);
        showNotificacion('Rutina actualizada con éxito', 'success');
      } else {
        await entrenamientoServicio.crearRutina(payload);
        showNotificacion('Rutina creada con éxito', 'success');
      }

      setRutinaForm({ ...getInitialRutina(), plan_id: planSeleccionadoId });
      const response = await entrenamientoServicio.obtenerRutinas({ plan_id: planSeleccionadoId, per_page: 100 });
      setRutinasPlan(response.datos || []);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar la rutina';
      showNotificacion(mensaje, 'error');
    }
  };

  const handleRmChange = (e) => {
    const { name, value } = e.target;
    setRmForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleNuevoRm = () => {
    setRmForm(getInitialRm());
  };

  const handleEditarRm = (r) => {
    setRmForm({
      ...r,
      fecha_registro: limpiarFechaRm(r.fecha_registro),
    });
  };

  const handleGuardarRm = async () => {
    try {
      if (!rmForm.ejercicio_id || !rmForm.peso || !rmForm.fecha_registro || (rmForm.tipo_registro === 'ESTIMADO' && !rmForm.repeticiones)) {
        showNotificacion('Completa los campos obligatorios del registro RM', 'warning');
        return;
      }

      const payload = {
        ...rmForm,
        cliente_id: formData.id,
        peso: Number(rmForm.peso),
        rm_estimado: undefined,
        repeticiones: rmForm.repeticiones ? Number(rmForm.repeticiones) : null,
      };
      if (payload.repeticiones === null) delete payload.repeticiones;
      if (!payload.observaciones) delete payload.observaciones;

      if (rmForm.id) {
        await entrenamientoServicio.actualizarRegistroRm(rmForm.id, payload);
        showNotificacion('Registro RM actualizado con éxito', 'success');
      } else {
        await entrenamientoServicio.crearRegistroRm(payload);
        showNotificacion('Registro RM guardado con éxito', 'success');
      }

      setRmForm(getInitialRm());
      cargarEntrenamientoCliente(formData.id);
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      const mensaje = error.response?.data?.mensaje || primerError || error.response?.data?.message || 'Error al guardar el registro RM';
      showNotificacion(mensaje, 'error');
    }
  };

  const renderEntrenamiento = () => (
    <Stack spacing={2}>
      <PruebasRendimientoDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />
      <Box sx={formStyles.seccion}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {planEntrenamientoForm.id ? 'Editar plan' : 'Nuevo plan de entrenamiento'}
          </Typography>
          {planEntrenamientoForm.id ? (
            <Button size="small" onClick={handleNuevoPlanEntrenamiento}>Cancelar edición</Button>
          ) : null}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField label="Nombre del plan" name="nombre" value={planEntrenamientoForm.nombre || ''} onChange={handlePlanEntrenamientoChange} required size="small" />
          <TextField select label="Entrenador" name="entrenador_id" value={planEntrenamientoForm.entrenador_id || ''} onChange={handlePlanEntrenamientoChange} size="small">
            <MenuItem value="">Sin asignar</MenuItem>
            {entrenadoresDisp.map((ent) => (
              <MenuItem key={ent.usuario_id} value={ent.usuario_id}>{`${ent.nombres || ''} ${ent.apellidos || ''}`.trim() || ent.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Estado" name="estado" value={planEntrenamientoForm.estado || 'BORRADOR'} onChange={handlePlanEntrenamientoChange} required size="small">
            <MenuItem value="BORRADOR">Borrador</MenuItem>
            <MenuItem value="ACTIVO">Activo</MenuItem>
            <MenuItem value="PAUSADO">Pausado</MenuItem>
            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
          </TextField>
          <TextField label="Fecha inicio" name="fecha_inicio" type="date" value={planEntrenamientoForm.fecha_inicio || ''} onChange={handlePlanEntrenamientoChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Fecha fin" name="fecha_fin" type="date" value={planEntrenamientoForm.fecha_fin || ''} onChange={handlePlanEntrenamientoChange} size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Objetivo" name="objetivo" value={planEntrenamientoForm.objetivo || ''} onChange={handlePlanEntrenamientoChange} size="small" />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <TextField label="Observaciones" name="observaciones" value={planEntrenamientoForm.observaciones || ''} onChange={handlePlanEntrenamientoChange} size="small" fullWidth multiline minRows={2} />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto={planEntrenamientoForm.id ? 'Guardar cambios' : 'Guardar plan'} onClick={handleGuardarPlanEntrenamiento} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Planes del cliente</Typography>
        {planesEntrenamiento.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene planes de entrenamiento todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {planesEntrenamiento.map((p) => (
              <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: p.id === planSeleccionadoId ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: 2, p: 1.25, cursor: 'pointer' }}
                onClick={() => handleSeleccionarPlan(p)}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Chip label={p.estado} size="small" />
                  <Typography variant="body2" fontWeight="500">{p.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">{fechaPlan(p.fecha_inicio)} - {p.fecha_fin ? fechaPlan(p.fecha_fin) : 'Sin fin'}</Typography>
                  {p.entrenador_nombre ? <Typography variant="body2" color="text.secondary">Entrenador: {p.entrenador_nombre}</Typography> : null}
                </Stack>
                <Tooltip title="Editar plan">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditarPlanEntrenamiento(p); }}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      {planSeleccionadoId ? (
        <Box sx={formStyles.seccion}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>
              {rutinaForm.id ? 'Editar rutina' : 'Nueva rutina'} — {planesEntrenamiento.find((p) => p.id === planSeleccionadoId)?.nombre}
            </Typography>
            {rutinaForm.id ? (
              <Button size="small" onClick={handleNuevaRutina}>Cancelar edición</Button>
            ) : null}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            <TextField select label="Ejercicio" name="ejercicio_id" value={rutinaForm.ejercicio_id || ''} onChange={handleRutinaChange} required size="small">
              {ejerciciosDisp.map((ej) => (
                <MenuItem key={ej.id} value={ej.id}>{ej.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Día" name="dia" value={rutinaForm.dia || 'LUNES'} onChange={handleRutinaChange} required size="small">
              {DIAS_SEMANA.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField label="Semana" name="semana" type="number" value={rutinaForm.semana || 1} onChange={handleRutinaChange} required size="small" />
            <TextField label="Bloque" name="bloque" value={rutinaForm.bloque || ''} onChange={handleRutinaChange} size="small" />
            <TextField label="Series" name="series" type="number" value={rutinaForm.series || 1} onChange={handleRutinaChange} required size="small" />
            <TextField label="Repeticiones" name="repeticiones" value={rutinaForm.repeticiones || ''} onChange={handleRutinaChange} size="small" />
            <TextField select label="Tipo carga" name="tipo_carga" value={rutinaForm.tipo_carga || 'LIBRE'} onChange={handleRutinaChange} required size="small">
              {TIPOS_CARGA.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField
              label={rutinaForm.tipo_carga === 'PORCENTAJE_RM' ? 'Carga objetivo (%)' : 'Carga objetivo'}
              name="carga_objetivo"
              type="number"
              value={rutinaForm.carga_objetivo || ''}
              onChange={handleRutinaChange}
              size="small"
              helperText={(() => {
                const sugerido = pesoSugeridoPorPorcentaje(rutinaForm, ultimosRm);
                return sugerido ? `Peso sugerido: ${sugerido.toFixed(1)} (último RM: ${Number(ultimosRm[rutinaForm.ejercicio_id]?.rm_estimado).toFixed(1)})` : '';
              })()}
            />
            <TextField label="Descanso (seg)" name="descanso_segundos" type="number" value={rutinaForm.descanso_segundos || ''} onChange={handleRutinaChange} size="small" />
            <TextField label="Orden" name="orden" type="number" value={rutinaForm.orden || 1} onChange={handleRutinaChange} required size="small" />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <TextField label="Notas" name="notas" value={rutinaForm.notas || ''} onChange={handleRutinaChange} size="small" fullWidth multiline minRows={2} />
          </Box>
          <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <BotonGuardar texto={rutinaForm.id ? 'Guardar cambios' : 'Guardar rutina'} onClick={handleGuardarRutina} />
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={formStyles.modalSeccionTitulo}>Rutinas del plan</Typography>
            {rutinasPlan.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Este plan no tiene rutinas todavía.</Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {rutinasPlan.map((r) => {
                  const sugerido = pesoSugeridoPorPorcentaje(r, ultimosRm);
                  return (
                    <Stack key={r.id} direction="row" alignItems="center" justifyContent="space-between"
                      sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Chip label={`Sem ${r.semana} · ${r.dia}`} size="small" />
                        <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.series} series{r.repeticiones ? ` x ${r.repeticiones}` : ''}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.carga_objetivo ? `${r.carga_objetivo} ${r.tipo_carga}` : r.tipo_carga}</Typography>
                        {sugerido ? <Chip label={`Sugerido: ${sugerido.toFixed(1)}`} size="small" color="info" /> : null}
                      </Stack>
                      <Tooltip title="Editar rutina">
                        <IconButton size="small" onClick={() => handleEditarRutina(r)}>
                          <EditOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      ) : null}

      <Box sx={formStyles.seccion}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {rmForm.id ? 'Editar registro RM' : 'Nuevo registro RM'}
          </Typography>
          {rmForm.id ? (
            <Button size="small" onClick={handleNuevoRm}>Cancelar edición</Button>
          ) : null}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <TextField select label="Ejercicio" name="ejercicio_id" value={rmForm.ejercicio_id || ''} onChange={handleRmChange} required size="small">
            {ejerciciosDisp.map((ej) => (
              <MenuItem key={ej.id} value={ej.id}>{ej.nombre}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Tipo registro" name="tipo_registro" value={rmForm.tipo_registro || 'ESTIMADO'} onChange={handleRmChange} required size="small">
            {TIPOS_RM.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Fecha de registro" name="fecha_registro" type="date" value={rmForm.fecha_registro || ''} onChange={handleRmChange} required size="small" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Peso" name="peso" type="number" value={rmForm.peso || ''} onChange={handleRmChange} required size="small" />
          <TextField label="Repeticiones" name="repeticiones" type="number" value={rmForm.tipo_registro === 'DIRECTO' ? 1 : rmForm.repeticiones || ''} onChange={handleRmChange} size="small"
            disabled={rmForm.tipo_registro === 'DIRECTO'} required={rmForm.tipo_registro === 'ESTIMADO'}
            inputProps={{ min: 1, max: 10 }} helperText={rmForm.tipo_registro === 'ESTIMADO' ? '1 a 10 repeticiones · fórmula Epley' : 'Una repetición máxima real'} />
          <TextField label={rmForm.tipo_registro === 'DIRECTO' ? '1RM medida (kg)' : '1RM estimada (kg)'} size="small"
            value={rmForm.peso && rmForm.tipo_registro === 'DIRECTO' ? Number(rmForm.peso).toFixed(2) : rmForm.peso && Number(rmForm.repeticiones) >= 1 && Number(rmForm.repeticiones) <= 10 ? (Number(rmForm.peso) * (1 + Number(rmForm.repeticiones) / 30)).toFixed(2) : ''}
            InputProps={{ readOnly: true }} helperText="Cálculo definitivo validado por Laravel" />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <TextField label="Observaciones" name="observaciones" value={rmForm.observaciones || ''} onChange={handleRmChange} size="small" fullWidth multiline minRows={2} />
        </Box>
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <BotonGuardar texto={rmForm.id ? 'Guardar cambios' : 'Guardar registro RM'} onClick={handleGuardarRm} />
        </Stack>
      </Box>

      <Box sx={formStyles.seccion}>
        <Typography sx={formStyles.modalSeccionTitulo}>Historial de RM</Typography>
        {rmCliente.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Este cliente no tiene registros de RM todavía.</Typography>
        ) : (
          <Stack spacing={1}>
            {rmCliente.map((r) => (
              <Stack key={r.id} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.25 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary">{fechaRm(r.fecha_registro)}</Typography>
                  <Typography variant="body2" fontWeight="500">{r.ejercicio_nombre}</Typography>
                  <Chip label={`RM ${Number(r.rm_estimado).toFixed(1)}`} size="small" />
                  <Typography variant="body2" color="text.secondary">{r.tipo_registro}</Typography>
                </Stack>
                <Tooltip title="Editar registro">
                  <IconButton size="small" onClick={() => handleEditarRm(r)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  if (vista === 'formulario') {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo="Nuevo Cliente"
          descripcion="Registra los datos principales; luego podrás completar el resto de su ficha"
          icono={<PeopleAltOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelar} />}
        />

        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            {renderCamposDatos()}
          </Box>
          <AccionesFormulario onGuardar={handleGuardar} onCancelar={handleCancelar} guardando={guardandoCliente} />
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  if (vista === 'ficha') {
    const nombreCliente = `${formData.nombres || ''} ${formData.apellidos || ''}`.trim() || formData.usuario_nombre || formData.name || formData.codigo_deportista;
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo={`Perfil integral de ${nombreCliente}`}
          descripcion="Consulta y administra su información personal, membresías, valoraciones, entrenamientos y seguimiento deportivo."
          icono={<PeopleAltOutlinedIcon />}
          acciones={<BotonVolver onClick={handleCancelarFicha} />}
        />
        <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          {formData.codigo_deportista && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 1.5 }}>
              <Chip size="small" variant="outlined" label={`Código cliente: ${formData.codigo_deportista}`} />
            </Box>
          )}
          <PestanasEstandar
            value={tabFicha}
            onChange={handleCambiarTabFicha}
            opciones={TABS_FICHA}
          />
          <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
            {tabFicha === 'datos' && renderCamposDatos()}
            {tabFicha === 'ficha_inicial' && <FichaInicialDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />}
            {tabFicha === 'entrenador' && renderEntrenadorYHorario()}
            {tabFicha === 'membresia' && renderMembresia()}
            {tabFicha === 'progreso' && <InformeProgresoDeportista deportistaId={formData.id} onNotificacion={showNotificacion} />}
            {tabFicha === 'entrenamiento' && renderEntrenamiento()}
          </Box>
          {tabFicha === 'datos' && (
            <Stack spacing={1.5}>
              <AccionesFormulario onGuardar={handleGuardarDatosFicha} onCancelar={handleCancelarFicha} textoCancelar="Volver a la lista" />
            </Stack>
          )}
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
      </Box>
    );
  }

  // VISTA LISTA
  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Clientes"
        descripcion="Directorio principal de clientes y miembros del gimnasio"
        icono={<PeopleAltOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || deportistas.length}
          busqueda={filtros.busqueda}
          onBusqueda={(v) => buscar({ ...filtros, busqueda: v })}
          acciones={
            <Button
              startIcon={<AddOutlinedIcon />}
              onClick={handleNuevo}
              sx={dbanuStyles.addButtonRevive}
            >
              Añadir
            </Button>
          }
        />

        <DeportistasTable
          deportistas={deportistas}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onAbrirFicha={handleAbrirFicha}
          onPageChange={(p) => {
            const n = { ...filtros, page: p };
            setFiltros(n);
            cargarDeportistas(n);
          }}
          onRowsPerPageChange={(pp) => {
            const n = { ...filtros, page: 1, per_page: pp };
            setFiltros(n);
            cargarDeportistas(n);
          }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ ...notificacion, mensaje: "" })} />
    </Box>
  );
}
