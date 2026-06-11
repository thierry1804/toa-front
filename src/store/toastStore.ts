import { useUiStore } from './ui.store'

export const useToastStore = {
  showSuccess: (message: string) =>
    useUiStore.getState().addToast({ message, type: 'success' }),
  showError: (message: string) =>
    useUiStore.getState().addToast({ message, type: 'error' }),
  showInfo: (message: string) =>
    useUiStore.getState().addToast({ message, type: 'info' }),
  showWarning: (message: string) =>
    useUiStore.getState().addToast({ message, type: 'warning' }),
}
