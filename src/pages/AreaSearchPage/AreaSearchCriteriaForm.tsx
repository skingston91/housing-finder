import {
  Box,
  Button,
  Checkbox,
  Grid,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import type {
  CommuteConstraints,
  PropertyType,
  TransitJourneyPreference,
} from '@/domain/criteria/types';
import { TFL_SUGGESTED_LINE_IDS } from '@shared/commute/tflSuggestedLondonLineIds';

import type { AreaSearchFormState } from './buildSearchAreasRequest';

const PROPERTY_OPTIONS: readonly { value: PropertyType; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'semi_detached', label: 'Semi-detached' },
  { value: 'detached', label: 'Detached' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
] as const;

const COMMUTE_OPTIONS: readonly { value: CommuteConstraints['mode']; label: string }[] = [
  { value: 'driving', label: 'Driving' },
  { value: 'transit', label: 'Transit (TfL Journey Planner when API key is set)' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'walking', label: 'Walking' },
] as const;

const TRANSIT_PLANNER_OPTIONS: readonly { value: TransitJourneyPreference; label: string }[] = [
  { value: 'least_time', label: 'Fastest (least time)' },
  { value: 'least_interchange', label: 'Fewest changes' },
  { value: 'least_walking', label: 'Least walking' },
];

const SCHOOL_PHASE_OPTIONS = [
  { value: 'primary' as const, label: 'Primary' },
  { value: 'secondary' as const, label: 'Secondary' },
  { value: 'sixth_form' as const, label: 'Sixth form' },
];

export interface AreaSearchCriteriaFormProps {
  readonly form: AreaSearchFormState;
  readonly onChange: (next: AreaSearchFormState) => void;
  readonly onSubmit: () => void;
  readonly isLoading: boolean;
  readonly disabled?: boolean;
  readonly onGeocodeFromLabel?: () => void;
  readonly geocodeFromLabelPending?: boolean;
  readonly geocodeFromLabelError?: string | null;
}

export const AreaSearchCriteriaForm = ({
  form,
  onChange,
  onSubmit,
  isLoading,
  disabled = false,
  onGeocodeFromLabel,
  geocodeFromLabelPending = false,
  geocodeFromLabelError = null,
}: AreaSearchCriteriaFormProps) => {
  const toggleProperty = (value: PropertyType, checked: boolean): void => {
    const next = new Set(form.propertyTypes);
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    onChange({ ...form, propertyTypes: [...next] });
  };

  const togglePhase = (value: 'primary' | 'secondary' | 'sixth_form', checked: boolean): void => {
    const next = new Set(form.schoolPhases);
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    onChange({ ...form, schoolPhases: next });
  };

  return (
    <Stack
      gap={6}
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Stack gap={1}>
        <Heading size="md">Affordability</Heading>
        <Text fontSize="sm" color="fg.muted">
          Max price and optional ceiling on £/m² (Land Registry–driven aggregates later).
        </Text>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Stack gap={1}>
            <Text fontWeight="medium">Max price (£)</Text>
            <Input
              type="number"
              min={1}
              value={form.maxPriceGbp === '' ? '' : String(form.maxPriceGbp)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  onChange({ ...form, maxPriceGbp: '' });
                  return;
                }
                const v = Number(raw);
                onChange({ ...form, maxPriceGbp: Number.isFinite(v) ? v : form.maxPriceGbp });
              }}
              aria-label="Maximum price in GBP"
            />
          </Stack>
          <Stack gap={1}>
            <Text fontWeight="medium">Max £/m² (optional)</Text>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 8000"
              value={form.maxPricePerM2Gbp === '' ? '' : String(form.maxPricePerM2Gbp)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  onChange({ ...form, maxPricePerM2Gbp: '' });
                  return;
                }
                const v = Number(raw);
                onChange({ ...form, maxPricePerM2Gbp: Number.isFinite(v) ? v : '' });
              }}
              aria-label="Maximum price per square metre GBP optional"
            />
          </Stack>
        </Grid>
      </Stack>

      <Stack gap={2}>
        <Heading size="md">Property types</Heading>
        <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={3}>
          {PROPERTY_OPTIONS.map((opt) => (
            <Checkbox.Root
              key={opt.value}
              checked={form.propertyTypes.includes(opt.value)}
              onCheckedChange={(d) => {
                toggleProperty(opt.value, Boolean(d.checked));
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{opt.label}</Checkbox.Label>
            </Checkbox.Root>
          ))}
        </Grid>
      </Stack>

      <Stack gap={2}>
        <Heading size="md">Workplace</Heading>
        <Stack gap={1}>
          <Text fontWeight="medium">Label</Text>
          <Input
            value={form.workplaceLabel}
            onChange={(e) => {
              onChange({ ...form, workplaceLabel: e.target.value });
            }}
            aria-label="Workplace label"
          />
          {onGeocodeFromLabel ? (
            <Box>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={geocodeFromLabelPending}
                disabled={disabled || isLoading || geocodeFromLabelPending}
                onClick={() => {
                  onGeocodeFromLabel();
                }}
              >
                Fill coordinates from label
              </Button>
              {geocodeFromLabelError ? (
                <Text fontSize="sm" color="red.600" mt={1}>
                  {geocodeFromLabelError}
                </Text>
              ) : (
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  Uses OpenStreetMap Nominatim (UK-biased) via the local API — be gentle with rate
                  limits.
                </Text>
              )}
            </Box>
          ) : null}
        </Stack>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Stack gap={1}>
            <Text fontWeight="medium">Latitude</Text>
            <Input
              type="number"
              step="any"
              value={form.workplaceLat === '' ? '' : String(form.workplaceLat)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  onChange({ ...form, workplaceLat: '' });
                  return;
                }
                const v = Number(raw);
                onChange({ ...form, workplaceLat: Number.isFinite(v) ? v : '' });
              }}
              aria-label="Workplace latitude"
            />
          </Stack>
          <Stack gap={1}>
            <Text fontWeight="medium">Longitude</Text>
            <Input
              type="number"
              step="any"
              value={form.workplaceLng === '' ? '' : String(form.workplaceLng)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  onChange({ ...form, workplaceLng: '' });
                  return;
                }
                const v = Number(raw);
                onChange({ ...form, workplaceLng: Number.isFinite(v) ? v : '' });
              }}
              aria-label="Workplace longitude"
            />
          </Stack>
        </Grid>
      </Stack>

      <Stack gap={2}>
        <Heading size="md">Commute</Heading>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Stack gap={1}>
            <Text fontWeight="medium">Mode</Text>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={form.commuteMode}
                onChange={(e) => {
                  onChange({ ...form, commuteMode: e.target.value as CommuteConstraints['mode'] });
                }}
                aria-label="Commute mode"
              >
                {COMMUTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Stack>
          <Stack gap={1}>
            <Text fontWeight="medium">Max time (minutes)</Text>
            <Input
              type="number"
              min={1}
              value={form.commuteMaxMinutes}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange({
                  ...form,
                  commuteMaxMinutes: Number.isFinite(v) ? v : form.commuteMaxMinutes,
                });
              }}
              aria-label="Maximum commute minutes"
            />
          </Stack>
        </Grid>
        {form.commuteMode === 'transit' ? (
          <Stack gap={3} pl={{ md: 1 }} borderLeftWidth={{ md: '1px' }} borderColor="border.subtle">
            <Text fontSize="sm" fontWeight="medium">
              Transit planner (TfL)
            </Text>
            <Stack gap={1}>
              <Text fontSize="sm">Optimise for</Text>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={form.transitJourneyPreference}
                  onChange={(e) => {
                    onChange({
                      ...form,
                      transitJourneyPreference: e.target.value as TransitJourneyPreference,
                    });
                  }}
                  aria-label="TfL journey preference"
                >
                  {TRANSIT_PLANNER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Stack>
            <Checkbox.Root
              checked={form.transitIncludeAlternativeRoutes}
              onCheckedChange={(d) => {
                onChange({ ...form, transitIncludeAlternativeRoutes: Boolean(d.checked) });
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Ask TfL for alternative routes</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root
              checked={form.transitRequireMultipleJourneys}
              onCheckedChange={(d) => {
                onChange({ ...form, transitRequireMultipleJourneys: Boolean(d.checked) });
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Require at least two acceptable route options</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root
              checked={form.transitAtMostOneRailLeg}
              onCheckedChange={(d) => {
                onChange({ ...form, transitAtMostOneRailLeg: Boolean(d.checked) });
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                At most one tube/train leg (bus and walking still allowed)
              </Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root
              checked={form.transitAtMostOnePublicTransportLeg}
              onCheckedChange={(d) => {
                onChange({
                  ...form,
                  transitAtMostOnePublicTransportLeg: Boolean(d.checked),
                });
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                At most one non-walking leg (one bus/tube/train “hop”)
              </Checkbox.Label>
            </Checkbox.Root>
            <Stack gap={1}>
              <Text fontSize="sm" fontWeight="medium">
                Planner time (optional)
              </Text>
              <Text fontSize="xs" color="fg.muted">
                By default we use a typical weekday at 08:30 with average walking speed. Set both
                date and time to override this, or leave both empty to use TfL&apos;s own clock
                default. Requests use timetable-style data — live platform arrivals aren&apos;t
                used. The date picker follows your browser locale.
              </Text>
              <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={3}>
                <Input
                  type="date"
                  value={form.transitPlannerDate}
                  onChange={(e) => {
                    onChange({ ...form, transitPlannerDate: e.target.value });
                  }}
                  aria-label="TfL journey date"
                />
                <Input
                  type="time"
                  value={form.transitPlannerTime}
                  onChange={(e) => {
                    onChange({ ...form, transitPlannerTime: e.target.value });
                  }}
                  aria-label="TfL journey time"
                />
              </Grid>
              <Checkbox.Root
                checked={form.transitArriveBy}
                onCheckedChange={(d) => {
                  onChange({ ...form, transitArriveBy: Boolean(d.checked) });
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Arrive by this time (else depart at)</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root
                checked={form.transitOmitDefaultPlannerDeparture}
                onCheckedChange={(d) => {
                  onChange({
                    ...form,
                    transitOmitDefaultPlannerDeparture: Boolean(d.checked),
                  });
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                  When date and time are blank, use TfL&apos;s clock default (not our weekday 08:30
                  London slot)
                </Checkbox.Label>
              </Checkbox.Root>
            </Stack>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
              <Stack gap={1}>
                <Text fontSize="sm">Max walk (min, TfL)</Text>
                <Input
                  type="number"
                  min={1}
                  max={240}
                  placeholder="e.g. 15"
                  value={
                    form.transitMaxWalkingMinutes === ''
                      ? ''
                      : String(form.transitMaxWalkingMinutes)
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      onChange({ ...form, transitMaxWalkingMinutes: '' });
                      return;
                    }
                    const v = Number(raw);
                    onChange({
                      ...form,
                      transitMaxWalkingMinutes: Number.isFinite(v)
                        ? v
                        : form.transitMaxWalkingMinutes,
                    });
                  }}
                  aria-label="TfL max walking minutes"
                />
              </Stack>
              <Stack gap={1}>
                <Text fontSize="sm">Max interchange walk (min, TfL)</Text>
                <Input
                  type="number"
                  min={1}
                  max={240}
                  placeholder="e.g. 12"
                  value={
                    form.transitMaxTransferMinutes === ''
                      ? ''
                      : String(form.transitMaxTransferMinutes)
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      onChange({ ...form, transitMaxTransferMinutes: '' });
                      return;
                    }
                    const v = Number(raw);
                    onChange({
                      ...form,
                      transitMaxTransferMinutes: Number.isFinite(v)
                        ? v
                        : form.transitMaxTransferMinutes,
                    });
                  }}
                  aria-label="TfL max transfer walking minutes"
                />
              </Stack>
            </Grid>
            <Stack gap={1}>
              <Text fontSize="sm">Avoid tube / line ids (comma-separated)</Text>
              <Input
                placeholder="e.g. victoria, northern"
                list="tfl-suggested-line-ids"
                value={form.transitAvoidLineIds}
                onChange={(e) => {
                  onChange({ ...form, transitAvoidLineIds: e.target.value });
                }}
                aria-label="TfL line ids to avoid"
              />
              <datalist id="tfl-suggested-line-ids">
                {TFL_SUGGESTED_LINE_IDS.map((o) => (
                  <option key={o.id} value={o.id} label={o.label} />
                ))}
              </datalist>
              <Text fontSize="xs" color="fg.muted">
                Uses TfL line identifiers (e.g. central). Case-insensitive.
              </Text>
            </Stack>
          </Stack>
        ) : null}
      </Stack>

      <Stack gap={2}>
        <Heading size="md">Schools</Heading>
        <Stack gap={2}>
          {SCHOOL_PHASE_OPTIONS.map((opt) => (
            <Checkbox.Root
              key={opt.value}
              checked={form.schoolPhases.has(opt.value)}
              onCheckedChange={(d) => {
                togglePhase(opt.value, Boolean(d.checked));
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{opt.label}</Checkbox.Label>
            </Checkbox.Root>
          ))}
        </Stack>
        <Stack gap={1}>
          <Text fontWeight="medium">Max walk or drive to school (minutes, optional)</Text>
          <Input
            type="number"
            min={1}
            value={form.schoolMaxMinutes === '' ? '' : String(form.schoolMaxMinutes)}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onChange({ ...form, schoolMaxMinutes: '' });
                return;
              }
              const v = Number(raw);
              onChange({ ...form, schoolMaxMinutes: Number.isFinite(v) ? v : '' });
            }}
            aria-label="Maximum minutes to school optional"
          />
        </Stack>
      </Stack>

      <Stack gap={2}>
        <Heading size="md">Crime weighting</Heading>
        <Text fontSize="sm" color="fg.muted">
          Rolling window and JSON map of police.uk category → weight (higher = more impact on
          score).
        </Text>
        <Stack gap={1}>
          <Text fontWeight="medium">Window (months)</Text>
          <Input
            type="number"
            min={1}
            max={120}
            value={form.crimeWindowMonths}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({
                ...form,
                crimeWindowMonths: Number.isFinite(v) ? v : form.crimeWindowMonths,
              });
            }}
            aria-label="Crime data window in months"
          />
        </Stack>
        <Stack gap={1}>
          <Text fontWeight="medium">Category weights (JSON)</Text>
          <Textarea
            value={form.crimeWeightsJson}
            onChange={(e) => {
              onChange({ ...form, crimeWeightsJson: e.target.value });
            }}
            fontFamily="mono"
            fontSize="sm"
            rows={6}
            aria-label="Crime category weights JSON"
          />
        </Stack>
      </Stack>

      <Box>
        <Button
          type="submit"
          colorPalette="blue"
          loading={isLoading}
          disabled={disabled || isLoading}
        >
          Search areas
        </Button>
      </Box>
    </Stack>
  );
};
