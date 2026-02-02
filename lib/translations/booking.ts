export const bookingTranslations = {
  en: {
    pageTitle: 'Book a Demo - BRNNO',
    pageDescription: 'Schedule a 30-minute demo call to see how BRNNO can transform your auto detailing business',
    meetingTitle: '30 Minute Demo',
    duration: '30 min',
    selectDateTime: 'Select a Date & Time',
    selectTimeSubtitle: 'Choose a time that works best for you',
    availableTimes: 'Available Times',
    continueButton: 'Continue',
    backButton: 'Back',

    enterDetails: 'Enter Details',
    nameLabel: 'Name *',
    namePlaceholder: 'John Doe',
    emailLabel: 'Email *',
    emailPlaceholder: 'john@example.com',
    phoneLabel: 'Phone',
    phonePlaceholder: '(555) 123-4567',
    businessNameLabel: 'Business Name',
    businessNamePlaceholder: 'Elite Detailing',
    notesLabel: 'Additional Notes',
    notesPlaceholder: 'Tell us about your business...',
    scheduleMeetingButton: 'Schedule Meeting',
    submittingButton: 'Booking...',
    bookingFailed: 'Failed to book. Please try again.',

    confirmationTitle: "You're All Set! 🎉",
    confirmationMessage: "We've sent a confirmation email to",
    confirmationMessageSuffix: 'with your meeting details.',
    yourDemoCall: 'Your Demo Call',
    videoDetailsEmail: 'Video conference details provided via email',
    backToHome: 'Back to Home',

    webConferencingDetails: 'Web conferencing details provided upon confirmation.',
    leftPanelIntro: "See how BRNNO's AI-powered platform can transform your auto detailing business with:",
    bullet1: 'AI Auto-Scheduling',
    bullet2: 'Automated Lead Follow-Up',
    bullet3: 'Smart Calendar Management',

    timezoneLabel: 'Time zone',
    timezoneOptions: [
      'Mountain Time - US & Canada',
      'Pacific Time - US & Canada',
      'Central Time - US & Canada',
      'Eastern Time - US & Canada',
    ],
    dayAbbrev: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },
  es: {
    pageTitle: 'Reservar una Demostración - BRNNO',
    pageDescription: 'Programe una llamada de demostración de 30 minutos para ver cómo BRNNO puede transformar su negocio de detailing automotriz',
    meetingTitle: 'Demostración de 30 Minutos',
    duration: '30 min',
    selectDateTime: 'Seleccione Fecha y Hora',
    selectTimeSubtitle: 'Elija un horario que le funcione mejor',
    availableTimes: 'Horarios Disponibles',
    continueButton: 'Continuar',
    backButton: 'Atrás',

    enterDetails: 'Ingrese sus Datos',
    nameLabel: 'Nombre *',
    namePlaceholder: 'Juan Pérez',
    emailLabel: 'Correo Electrónico *',
    emailPlaceholder: 'juan@ejemplo.com',
    phoneLabel: 'Teléfono',
    phonePlaceholder: '(555) 123-4567',
    businessNameLabel: 'Nombre del Negocio',
    businessNamePlaceholder: 'Elite Detailing',
    notesLabel: 'Notas Adicionales',
    notesPlaceholder: 'Cuéntenos sobre su negocio...',
    scheduleMeetingButton: 'Programar Reunión',
    submittingButton: 'Reservando...',
    bookingFailed: 'No se pudo reservar. Por favor, intente de nuevo.',

    confirmationTitle: '¡Todo Listo! 🎉',
    confirmationMessage: 'Hemos enviado un correo de confirmación a',
    confirmationMessageSuffix: 'con los detalles de su reunión.',
    yourDemoCall: 'Su Llamada de Demostración',
    videoDetailsEmail: 'Los detalles de la videoconferencia se enviarán por correo',
    backToHome: 'Volver al Inicio',

    webConferencingDetails: 'Los detalles de la videoconferencia se proporcionarán tras la confirmación.',
    leftPanelIntro: 'Vea cómo la plataforma impulsada por IA de BRNNO puede transformar su negocio de detailing automotriz con:',
    bullet1: 'Programación Automática con IA',
    bullet2: 'Seguimiento Automatizado de Leads',
    bullet3: 'Gestión Inteligente del Calendario',

    timezoneLabel: 'Zona horaria',
    timezoneOptions: [
      'Hora de la montaña - EE. UU. y Canadá',
      'Hora del Pacífico - EE. UU. y Canadá',
      'Hora del centro - EE. UU. y Canadá',
      'Hora del este - EE. UU. y Canadá',
    ],
    dayAbbrev: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
  },
} as const

export type Language = keyof typeof bookingTranslations

export function getTranslations(lang: Language = 'en') {
  return bookingTranslations[lang] ?? bookingTranslations.en
}
