import { validateForm } from "./validation.js";
import { ApiError, sendQuestion } from "./api.js";
import {
	resetUI,
	setLoadingState,
	showError,
	showResponse,
	showValidationErrors
} from "./ui.js";

const form = document.getElementById("assistant-form");
let isSubmitting = false;

if (form) {
	form.noValidate = true;

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		if (isSubmitting) {
			return;
		}

		const formValues = Object.fromEntries(new FormData(form).entries());
		const validation = validateForm(formValues);

		resetUI();
		const fieldsAreValid = showValidationErrors(validation.errors);
		if (!validation.isValid || !fieldsAreValid) {
			showError("Corrige los campos indicados antes de enviar la consulta.");
			return;
		}

		isSubmitting = true;
		setLoadingState(true);

		try {
			const response = await sendQuestion(validation.values);

			if (response.ok) {
				showResponse(response);
			} else {
				showError(response.respuesta || "El asistente no pudo completar la consulta.");
			}
		} catch (error) {
			const message = error instanceof ApiError
				? error.message
				: "Ocurrió un error inesperado al comunicarse con el asistente.";
			showError(message);
		} finally {
			isSubmitting = false;
			setLoadingState(false);
		}
	});

	form.addEventListener("reset", (event) => {
		if (isSubmitting) {
			event.preventDefault();
			return;
		}

		resetUI();
	});
}
