export interface CatalogCategory {
  id: string;
  label: string;
  summary: string;
}

export class ServiceCatalog {
  static categories(): CatalogCategory[] {
    return [
      {
        id: 'device_setup',
        label: 'Device Setup',
        summary: 'Help setting up a phone, computer, or television.',
      },
      {
        id: 'troubleshooting',
        label: 'Fix/Repair',
        summary: 'Help when a device is not working as expected.',
      },
      {
        id: 'training',
        label: 'Learning',
        summary: 'One-to-one help learning a device or an app.',
      },
      {
        id: 'wifi_setup',
        label: 'WiFi/Network',
        summary: 'Help connecting a home to Wi-Fi and getting devices online.',
      },
      {
        id: 'printer_setup',
        label: 'Printers',
        summary: 'Help setting up a printer and getting it printing.',
      },
    ];
  }

  static consultationTopics(): CatalogCategory[] {
    return [
      ...ServiceCatalog.categories(),
      {
        id: 'unsure',
        label: 'Not sure yet',
        summary: 'Talk with HandyHearts about what kind of help fits.',
      },
    ];
  }

  static isBookableCategory(id: string): boolean {
    return ServiceCatalog.categories().some((category) => category.id === id);
  }

  static isConsultationTopic(id: string): boolean {
    return ServiceCatalog.consultationTopics().some((topic) => topic.id === id);
  }

  static consultationLabel(id: string): string {
    return ServiceCatalog.consultationTopics().find((topic) => topic.id === id)?.label ?? ServiceCatalog.labelFor(id);
  }

  static labelFor(id: string): string {
    const match = ServiceCatalog.categories().find((category) => category.id === id);
    if (match) return match.label;
    if (id === 'unsure') return 'Not sure yet';
    return id.replace(/_/g, ' ');
  }

  static matchService<T extends { name: string }>(services: T[], categoryId: string): T | null {
    const label = ServiceCatalog.labelFor(categoryId).trim().toLowerCase();
    return services.find((service) => service.name.trim().toLowerCase() === label) ?? null;
  }
}
