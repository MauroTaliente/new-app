import { useState, type ReactNode } from 'react';
import {
  Button,
  Field,
  Form,
  InputChips,
  InputDatePicker,
  InputSelect,
  InputSlider,
  InputSwitch,
  InputText,
  type InputDatePickerProps,
  type InputTextProps,
  type InputSliderProps,
} from '@maurotaliente/react-ui';
import { InputPropRow, type InputPropRowConfig } from './input-prop-row';

type DemoFormValues = {
  email: string;
  notes: string;
  textPassword: string;
  scheduleDate: string | null;
  dateCompactState: string | null;
  dateRelativeLimitsState: string | null;
  dateAbsoluteLimitsState: string | null;
  vacationRange: [string | null, string | null];
  dateHighlightedState: string | null;
  dateCustomRenderState: [string | null, string | null];
  skills: Array<{ key: string; label: string }>;
  role: { key: string; label: string } | null;
  notificationsEnabled: boolean;
  profileScore: number;
  riskTolerance: number;
  budgetRange: [number, number];
};

const skillOptions = [
  { key: 'react', label: 'React' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'vitest', label: 'Vitest' },
  { key: 'tailwind', label: 'Tailwind CSS' },
  { key: 'api-design', label: 'API Design' },
];

const roleOptions = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'design', label: 'Design' },
  { key: 'product', label: 'Product' },
];

const toLocalDayFromInputValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const candidate = new Date(year, month - 1, day);
      const isValid =
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day;
      return isValid ? candidate : null;
    }
    const candidate = new Date(value);
    if (!Number.isNaN(candidate.getTime())) {
      return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate());
    }
  }
  if (typeof value === 'number') {
    const candidate = new Date(value);
    if (!Number.isNaN(candidate.getTime())) {
      return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate());
    }
  }
  return null;
};

const isUnavailableDate = (day: Date): boolean => {
  const dayOfWeek = day.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const sliderEnumDefaults = {
  mode: 'single',
  indicators: 'off',
  focusMode: 'soft',
} as const;

const sliderNumberDefaults = {
  min: 0,
  max: 100,
  step: 1,
} as const;

const sliderBooleanProps = ['hidden', 'loading', 'disabled', 'showValue'] as const;
const sliderPropKeys = [
  'min',
  'max',
  'step',
  'mode',
  'indicators',
  'focusMode',
  'hidden',
  'loading',
  'disabled',
  'showValue',
  'value',
  'defaultRangeValue',
] as const;

const sliderPropRowConfig: InputPropRowConfig<InputSliderProps> = {
  keys: sliderPropKeys,
  booleanKeys: sliderBooleanProps,
  enumDefaults: sliderEnumDefaults,
  numberDefaults: sliderNumberDefaults,
  alwaysInclude: { disabled: false },
};

const inputTextEnumDefaults = {
  mode: 'text',
  indicators: 'off',
  focusMode: 'soft',
  type: 'text',
} as const;

const inputTextNumberDefaults = {
  rows: 2,
} as const;

const inputTextBooleanProps = [
  'hidden',
  'loading',
  'disabled',
  'required',
  'isClearable',
  'preventEnterSendForm',
] as const;

const inputTextPropKeys = [
  'type',
  'mode',
  'rows',
  'indicators',
  'focusMode',
  'hidden',
  'loading',
  'disabled',
  'required',
  'isClearable',
  'preventEnterSendForm',
  'value',
  'placeholder',
] as const;

const inputTextPropRowConfig: InputPropRowConfig<InputTextProps> = {
  keys: inputTextPropKeys,
  booleanKeys: inputTextBooleanProps,
  enumDefaults: inputTextEnumDefaults,
  numberDefaults: inputTextNumberDefaults,
  alwaysInclude: { disabled: false, mode: 'text' },
};

const inputDatePickerEnumDefaults = {
  selectionMode: 'single',
  valueMode: 'date',
  indicators: 'off',
  focusMode: 'soft',
  weekStartsOn: 1,
} as const;

const inputDatePickerBooleanProps = [
  'hidden',
  'disabled',
  'loading',
  'isClearable',
  'useDefaultDayStyles',
] as const;
const inputDatePickerPropKeys = [
  'selectionMode',
  'valueMode',
  'indicators',
  'focusMode',
  'weekStartsOn',
  'extraMonthRows',
  'hidden',
  'disabled',
  'loading',
  'isClearable',
  'useDefaultDayStyles',
  'value',
  'placeholder',
  'minDate',
  'maxDate',
  'rules',
] as const;

const inputDatePickerPropRowConfig: InputPropRowConfig<InputDatePickerProps> = {
  keys: inputDatePickerPropKeys,
  booleanKeys: inputDatePickerBooleanProps,
  enumDefaults: inputDatePickerEnumDefaults,
  numberDefaults: {},
  alwaysInclude: { disabled: false, selectionMode: 'single', valueMode: 'iso' },
};

const formSectionItems = [
  { id: 'form-input-slider', label: 'InputSlider' },
  { id: 'form-input-text', label: 'InputText' },
  { id: 'form-input-date-picker', label: 'InputDatePicker' },
  { id: 'form-input-chips', label: 'InputChips' },
  { id: 'form-input-select', label: 'InputSelect' },
  { id: 'form-input-switch', label: 'InputSwitch' },
] as const;

function DemoInputSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-border-200 bg-bg-100 p-space-md">
      <header className="mb-space-md">
        <h3 className="text-sm font-semibold text-text-100">{title}</h3>
        <p className="mt-space-2xs text-xs text-text-300">{description}</p>
      </header>
      <div className="flex flex-col gap-space-md">{children}</div>
    </section>
  );
}

export function FormPanel({
  codeClassName,
  badgeClassName,
  panelClassName,
  sectionClassName,
}: {
  codeClassName: string;
  badgeClassName: string;
  panelClassName: string;
  sectionClassName: string;
}) {
  const [activeSection, setActiveSection] = useState<string>(formSectionItems[0].id);

  const renderSectionContent = (api: any) => {
    if (activeSection === 'form-input-slider') {
      return (
        <DemoInputSection
          title="InputSlider showcase"
          description="Continuo, segmentado, range y estados especiales."
        >
          <Field<InputSliderProps>
            {...api.connect('profileScore')}
            label="Profile score (continuo)"
            disclaimer="Drag libre con step fino"
            min={0}
            max={100}
            step={1}
            mode="single"
            indicators="all"
            showValue
          >
            <InputSlider name="profileScore" />
            <InputPropRow config={sliderPropRowConfig} />
          </Field>

          <Field<InputSliderProps>
            {...api.connect('riskTolerance')}
            label="Risk tolerance (segmentado)"
            disclaimer="Snap por segmentos de 10 puntos"
            min={0}
            max={100}
            step={10}
            mode="single"
            indicators="off"
            focusMode="highLight"
            showValue={false}
          >
            <InputSlider name="riskTolerance" />
            <InputPropRow config={sliderPropRowConfig} />
          </Field>

          <Field<InputSliderProps>
            {...api.connect('budgetRange')}
            label="Budget range"
            disclaimer="Range con dos thumbs y limites bloqueados"
            min={0}
            max={100}
            step={5}
            mode="range"
            indicators="all"
            showValue
          >
            <InputSlider name="budgetRange" />
            <InputPropRow config={sliderPropRowConfig} />
          </Field>
          <Field<InputSliderProps>
            name="sliderDisabled"
            label="Slider disabled"
            disclaimer="Caso disabled"
            min={0}
            max={100}
            value={35}
            disabled
            showValue={false}
          >
            <InputSlider name="sliderDisabled" />
            <InputPropRow config={sliderPropRowConfig} />
          </Field>
          <Field<InputSliderProps>
            name="sliderLoading"
            label="Slider loading"
            disclaimer="Caso loading"
            min={0}
            max={100}
            value={[30, 70]}
            mode="range"
            loading
            showValue={false}
          >
            <InputSlider name="sliderLoading" />
            <InputPropRow config={sliderPropRowConfig} />
          </Field>
        </DemoInputSection>
      );
    }

    if (activeSection === 'form-input-text') {
      return (
        <DemoInputSection
          title="InputText showcase"
          description="Text, area, password y comportamiento disabled/loading."
        >
          <Field<InputTextProps> {...api.connect('email')} label="Email (conectado)" required indicators="all" isClearable>
            <InputText
              name="email"
              type="email"
              autoComplete="email"
            />
            <InputPropRow config={inputTextPropRowConfig} />
          </Field>
          <Field<InputTextProps> {...api.connect('notes')} label="Notas (conectado area)" mode="area" rows={3}>
            <InputText name="notes" mode="area" rows={3} placeholder="Opcional" />
            <InputPropRow config={inputTextPropRowConfig} />
          </Field>
          <Field<InputTextProps>
            {...api.connect('textPassword')}
            label="Password state"
            disclaimer="Toggle show/hide en password"
            type="password"
          >
            <InputText name="textPassword" />
            <InputPropRow config={inputTextPropRowConfig} />
          </Field>
          <Field<InputTextProps>
            name="textDisabled"
            label="Text disabled"
            disclaimer="Caso disabled"
            value="Valor bloqueado"
            disabled
          >
            <InputText name="textDisabled" />
            <InputPropRow config={inputTextPropRowConfig} />
          </Field>
          <Field<InputTextProps>
            name="textLoading"
            label="Text loading"
            disclaimer="Caso loading"
            value="Cargando..."
            loading
          >
            <InputText name="textLoading" />
            <InputPropRow config={inputTextPropRowConfig} />
          </Field>
        </DemoInputSection>
      );
    }

    if (activeSection === 'form-input-date-picker') {
      return (
        <DemoInputSection
          title="InputDatePicker showcase"
          description="Default, grilla compacta, range y reglas custom + casos de valor."
        >
          <Field<InputDatePickerProps>
            {...api.connect('scheduleDate')}
            label="Single default"
            disclaimer="Caso lo mas cercano al default"
            valueMode="iso"
            indicators="all"
            isClearable
          >
            <InputDatePicker name="scheduleDate" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>

          <Field<InputDatePickerProps>
            {...api.connect('dateCompactState')}
            label="Compact month"
            disclaimer="Ejemplo con extraMonthRows y props no esenciales"
            valueMode="date"
            placeholder="Mes compacto"
            weekStartsOn={0}
            extraMonthRows={0}
            isClearable
          >
            <InputDatePicker name="dateCompactState" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>

          <Field<InputDatePickerProps>
            {...api.connect('dateRelativeLimitsState')}
            label="Relative limits"
            disclaimer="Limites relativos: hoy -80 anios / hoy +80 anios"
            valueMode="iso"
            minDate={{ yearsFromToday: -80 }}
            maxDate={{ yearsFromToday: 80 }}
            placeholder="dd/mm/aaaa en ventana relativa"
            isClearable
          >
            <InputDatePicker name="dateRelativeLimitsState" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>

          <Field<InputDatePickerProps>
            {...api.connect('dateAbsoluteLimitsState')}
            label="Absolute limits"
            disclaimer="Limites absolutos fijos"
            valueMode="iso"
            minDate="2026-01-01"
            maxDate="2026-12-31"
            placeholder="dd/mm/aaaa entre 2026 y 2027"
            isClearable
          >
            <InputDatePicker name="dateAbsoluteLimitsState" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>

          <Field<InputDatePickerProps>
            {...api.connect('vacationRange')}
            label="Range picker"
            disclaimer="Seleccion por rango con estilos base"
            valueMode="iso"
            selectionMode="range"
            placeholder="Selecciona un rango"
          >
            <InputDatePicker name="vacationRange" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>

          <Field<InputDatePickerProps>
            {...api.connect('dateHighlightedState')}
            label="Rules applied"
            disclaimer="Reglas disabled + regular con className (misma regla que validator)"
            valueMode="iso"
            selectionMode="single"
            rules={[
              // {
              //   type: 'disabled',
              //   name: 'weekend-disabled',
              //   matchers: [isUnavailableDate],
              // },
              {
                type: 'regular',
                name: 'highlighted-days',
                dates: ['2026-05-04T00:00:00.000Z', '2026-05-05T00:00:00.000Z'],
                className: 'bg-positive-200/20 text-positive-100',
              },
              {
                type: 'regular',
                name: 'first-day-ring',
                matchers: [(day: Date) => day.getDate() === 1],
                className: 'ring-2 ring-accent-200/70',
              },
            ]}
          >
            <InputDatePicker name="dateHighlightedState" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>

          <Field<InputDatePickerProps>
            {...api.connect('dateCustomRenderState')}
            label="Custom render"
            disclaimer="Rango naranja + puntas rojas via rules.render"
            valueMode="iso"
            selectionMode="range"
            useDefaultDayStyles={false}
            rules={[
              {
                type: 'regular',
                name: 'range-middle-orange',
                className: 'text-text-100',
                render: ({ rangeMiddle, content }) =>
                  rangeMiddle ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-advice-200/70 text-text-100">
                      {content}
                    </span>
                  ) : (
                    content
                  ),
              },
              {
                type: 'regular',
                name: 'range-edges-red',
                className: 'text-text-100',
                render: ({ rangeLeft, rangeRight, content }) =>
                  rangeLeft || rangeRight ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-negative-200 text-text-100-alt font-semibold">
                      {content}
                    </span>
                  ) : (
                    content
                  ),
              },
              {
                type: 'regular',
                name: 'current-day-dot',
                className: 'relative',
                render: ({ currentDate, content }) => (
                  <span className="relative inline-flex h-full w-full items-center justify-center">
                    {content}
                    {currentDate ? (
                      <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-accent-100" />
                    ) : null}
                  </span>
                ),
              },
            ]}
          >
            <InputDatePicker name="dateCustomRenderState" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>

          <Field<InputDatePickerProps>
            name="dateDisabledState"
            label="Date disabled"
            disclaimer="Caso de valor: disabled bloqueado"
            valueMode="iso"
            selectionMode="single"
            value="2026-05-06T00:00:00.000Z"
            disabled
          >
            <InputDatePicker name="dateDisabledState" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>
          <Field<InputDatePickerProps>
            name="dateLoadingState"
            label="Date loading"
            disclaimer="Caso de valor: loading bloqueado"
            valueMode="iso"
            selectionMode="single"
            value="2026-05-07T00:00:00.000Z"
            loading
          >
            <InputDatePicker name="dateLoadingState" />
            <InputPropRow config={inputDatePickerPropRowConfig} />
          </Field>
        </DemoInputSection>
      );
    }

    if (activeSection === 'form-input-chips') {
      return (
        <DemoInputSection
          title="InputChips showcase"
          description="Modos free/strict con estados disabled y loading."
        >
          <Field {...api.connect('skills')} label="Skills (conectado)" disclaimer="Enter para agregar">
            <InputChips
              name="skills"
              chipName="key"
              chipDisplayName="label"
              options={skillOptions}
              mode="free"
              indicators="all"
              isClearable
              placeholder="Ej: React, TypeScript"
            />
          </Field>
          <Field name="chipsStates" label="InputChips states" disclaimer="Free, strict, disabled y loading">
            <div className="flex w-full flex-col gap-space-sm">
              <InputChips
                name="chipsFreeState"
                chipName="key"
                chipDisplayName="label"
                options={skillOptions}
                mode="free"
                indicators="all"
                isClearable
                placeholder="Modo free"
              />
              <InputChips
                name="chipsStrictState"
                chipName="key"
                chipDisplayName="label"
                options={skillOptions}
                mode="strict"
                placeholder="Modo strict"
              />
              <InputChips
                name="chipsDisabledState"
                chipName="key"
                chipDisplayName="label"
                options={skillOptions}
                value={[skillOptions[0], skillOptions[1]]}
                mode="strict"
                disabled
              />
              <InputChips
                name="chipsLoadingState"
                chipName="key"
                chipDisplayName="label"
                options={skillOptions}
                value={[skillOptions[2]]}
                mode="free"
                loading
              />
            </div>
          </Field>
        </DemoInputSection>
      );
    }

    if (activeSection === 'form-input-select') {
      return (
        <DemoInputSection
          title="InputSelect showcase"
          description="Modos strict/free y estados disabled/loading."
        >
          <Field {...api.connect('role')} label="Rol principal (conectado)">
            <InputSelect
              name="role"
              optionName="key"
              optionDisplayName="label"
              options={roleOptions}
              mode="strict"
              placeholder="Selecciona un rol"
            />
          </Field>
          <Field name="selectStates" label="InputSelect states" disclaimer="Strict, free, disabled y loading">
            <div className="flex w-full flex-col gap-space-sm">
              <InputSelect
                name="selectStrictState"
                optionName="key"
                optionDisplayName="label"
                options={roleOptions}
                mode="strict"
                placeholder="Selecciona un rol (strict)"
                isClearable
              />
              <InputSelect
                name="selectFreeState"
                optionName="key"
                optionDisplayName="label"
                options={roleOptions}
                mode="free"
                placeholder="Puedes escribir un valor libre"
                isClearable
              />
              <InputSelect
                name="selectDisabledState"
                optionName="key"
                optionDisplayName="label"
                options={roleOptions}
                value={roleOptions[0]}
                mode="strict"
                disabled
              />
              <InputSelect
                name="selectLoadingState"
                optionName="key"
                optionDisplayName="label"
                options={roleOptions}
                value={roleOptions[2]}
                mode="strict"
                loading
              />
            </div>
          </Field>
        </DemoInputSection>
      );
    }

    return (
      <DemoInputSection
        title="InputSwitch showcase"
        description="Estados ON/OFF entre modo clean y marked, incluyendo disabled."
      >
        <Field
          {...api.connect('notificationsEnabled')}
          label="Notificaciones (conectado)"
          disclaimer="Recibe avisos sobre cambios de agenda"
        >
          <InputSwitch
            name="notificationsEnabled"
            mode="marked"
            color="blue"
            prefix={<span className="text-bs text-text-200">Desactivadas</span>}
            suffix={<span className="text-bs text-text-200">Activadas</span>}
          />
        </Field>
        <Field name="switchStates" label="InputSwitch states" disclaimer="Modo clean, marked y disabled">
          <div className="flex w-full flex-col gap-space-sm">
            <InputSwitch
              name="switchCleanOn"
              value
              mode="clean"
              color="green"
              prefix={<span className="text-bs text-text-200">Clean ON</span>}
            />
            <InputSwitch
              name="switchMarkedOff"
              value={false}
              mode="marked"
              color="orange"
              prefix={<span className="text-bs text-text-200">Marked OFF</span>}
              suffix={<span className="text-bs text-text-200">Toggle</span>}
            />
            <InputSwitch
              name="switchDisabledOn"
              value
              mode="marked"
              color="blue"
              disabled
              prefix={<span className="text-bs text-text-200">Disabled</span>}
            />
          </div>
        </Field>
      </DemoInputSection>
    );
  };

  return (
    <section className={sectionClassName}>
      <div>
        <span className={badgeClassName}>Organisms</span>
        <h2 className="mt-space-sm text-(length:--text-2xl) font-semibold tracking-tight text-text-100">
          Form, Field, InputText, InputDatePicker e InputChips
        </h2>
        <p className="mt-space-sm max-w-3xl text-text-200 text-(length:--text-md)">
          Formulario con validacion basica, campo con etiqueta y texto / area. El envio usa la API
          publica del paquete (<code className={codeClassName}>connect</code>,{' '}
          <code className={codeClassName}>nativeSubmit</code>) e incluye el nuevo date picker.
        </p>
      </div>

      <article className={panelClassName}>
        <Form<DemoFormValues>
          config={{
            space: 'demo',
            initialValues: {
              email: '',
              notes: '',
              textPassword: 'super-secret',
              scheduleDate: null,
              dateCompactState: null,
              dateRelativeLimitsState: null,
              dateAbsoluteLimitsState: null,
              vacationRange: [null, null],
              dateHighlightedState: '2026-05-01T00:00:00.000Z',
              dateCustomRenderState: [null, null],
              skills: [],
              role: null,
              notificationsEnabled: true,
              profileScore: 45,
              riskTolerance: 40,
              budgetRange: [20, 80],
            },
            validatorsRules: {
              email: (v) => (String(v ?? '').trim() ? undefined : 'Introduce un email'),
              dateHighlightedState: (v) => {
                const parsed = toLocalDayFromInputValue(v);
                if (!parsed) return undefined;
                return isUnavailableDate(parsed) ? 'La fecha seleccionada no esta disponible' : undefined;
              },
            },
            onSubmit: (api) => {
              void api.values;
            },
          }}
        >
          {(api) => (
            <div className="flex max-w-4xl flex-col gap-space-lg">
              <nav
                aria-label="Form input sections"
                className="sticky top-space-sm z-1 flex flex-wrap gap-space-xs rounded-card border border-border-200 bg-bg-100/95 p-space-xs backdrop-blur"
              >
                {formSectionItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="subtle"
                    active={activeSection === item.id}
                    size="xs"
                    className="rounded-pill"
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
              {renderSectionContent(api)}
              <div className="flex flex-wrap gap-space-sm">
                <Button type="submit" variant="main">
                  Enviar
                </Button>
                <Button type="button" variant="outline" onClick={() => api.reset()}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </Form>
      </article>
    </section>
  );
}
