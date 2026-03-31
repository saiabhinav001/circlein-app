export type DashboardWidgetSettings = {
  resident: {
    weather: boolean
    quickBooking: boolean
    communityPulse: boolean
    streak: boolean
    smartSuggestions: boolean
  }
  admin: {
    weather: boolean
    communityPulse: boolean
    operations: boolean
  }
}

export const DEFAULT_DASHBOARD_WIDGET_SETTINGS: DashboardWidgetSettings = {
  resident: {
    weather: true,
    quickBooking: true,
    communityPulse: true,
    streak: true,
    smartSuggestions: true,
  },
  admin: {
    weather: true,
    communityPulse: true,
    operations: true,
  },
}

export function mergeDashboardWidgetSettings(value: unknown): DashboardWidgetSettings {
  const incoming = (value || {}) as Partial<DashboardWidgetSettings>

  return {
    resident: {
      weather: incoming.resident?.weather ?? DEFAULT_DASHBOARD_WIDGET_SETTINGS.resident.weather,
      quickBooking: incoming.resident?.quickBooking ?? DEFAULT_DASHBOARD_WIDGET_SETTINGS.resident.quickBooking,
      communityPulse: incoming.resident?.communityPulse ?? DEFAULT_DASHBOARD_WIDGET_SETTINGS.resident.communityPulse,
      streak: incoming.resident?.streak ?? DEFAULT_DASHBOARD_WIDGET_SETTINGS.resident.streak,
      smartSuggestions:
        incoming.resident?.smartSuggestions ??
        DEFAULT_DASHBOARD_WIDGET_SETTINGS.resident.smartSuggestions,
    },
    admin: {
      weather: incoming.admin?.weather ?? DEFAULT_DASHBOARD_WIDGET_SETTINGS.admin.weather,
      communityPulse:
        incoming.admin?.communityPulse ?? DEFAULT_DASHBOARD_WIDGET_SETTINGS.admin.communityPulse,
      operations: incoming.admin?.operations ?? DEFAULT_DASHBOARD_WIDGET_SETTINGS.admin.operations,
    },
  }
}
