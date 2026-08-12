import type { useForm } from "react-hook-form";

export type RegisterValidate = (fn: () => boolean | Promise<boolean>) => void;

// Wires a react-hook-form step's own zod validation into MultiStepForm's
// shared "Suivant"/"Soumettre" button, instead of letting it advance
// unvalidated. Must be called on every render of the step (not inside an
// effect) so the registered validator always matches the currently rendered
// form instance.
export function wireStepValidation<T extends Record<string, unknown>>(
  registerValidate: RegisterValidate,
  handleSubmit: ReturnType<typeof useForm<T>>["handleSubmit"],
  onSubmit: (data: T) => void,
) {
  registerValidate(
    () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            onSubmit(data);
            resolve(true);
          },
          () => resolve(false),
        )();
      }),
  );
}
