const VALIDATION_FIELDS = [
	{ name: "tema", inputId: "tema", errorId: "tema-error" },
	{ name: "nivel", inputId: "nivel", errorId: "nivel-error" },
	{ name: "pregunta", inputId: "pregunta", errorId: "pregunta-error" },
	{ name: "integracion", inputId: "integracion", errorId: "integracion-error" }
];

function getElement(id) {
	return document.getElementById(id);
}

export function setLoadingState(isLoading) {
	const loadingIndicator = getElement("request-status");
	const submitButton = document.querySelector("#assistant-form button[type='submit']");
	const loading = Boolean(isLoading);

	if (loadingIndicator) {
		loadingIndicator.hidden = !loading;
	}

	if (submitButton) {
		submitButton.disabled = loading;
	}
}

export function showError(message) {
	const errorMessage = getElement("error-message");
	const text = typeof message === "string" ? message : "Ocurrió un error al procesar la consulta.";

	setLoadingState(false);
	if (errorMessage) {
		errorMessage.textContent = text;
		errorMessage.hidden = text.length === 0;
	}

	const responseSection = getElement("response-section");
	if (responseSection) {
		responseSection.hidden = true;
	}
}

export function showResponse(data) {
	if (!data || data.ok !== true) {
		const message = typeof data?.respuesta === "string" && data.respuesta.trim()
			? data.respuesta
			: "El asistente no pudo completar la consulta.";
		showError(message);
		return false;
	}

	const integrationNames = {
		nativo: "Nodo OpenAI",
		http: "HTTP Request / Responses API"
	};
	const errorMessage = getElement("error-message");	
	const responseSection = getElement("response-section");
	const responseText = getElement("response-text");
	const responseTopic = getElement("response-topic");
	const responseLevel = getElement("response-level");
	const responseIntegration = getElement("response-integration");

	setLoadingState(false);
	if (errorMessage) {
		errorMessage.textContent = "";
		errorMessage.hidden = true;
	}
	if (responseText) {
		responseText.textContent = data.respuesta;
	}
	if (responseTopic) {
		responseTopic.textContent = data.tema;
	}
	if (responseLevel) {
		responseLevel.textContent = data.nivel;
	}
	if (responseIntegration) {
		responseIntegration.textContent = integrationNames[data.integracion] ?? data.integracion;
	}
	if (responseSection) {
		responseSection.setAttribute("aria-live", "polite");
		responseSection.setAttribute("aria-atomic", "true");
		responseSection.hidden = false;
	}

	return true;
}

export function showValidationErrors(errors = {}) {
	const validationErrors = errors && typeof errors === "object" ? errors : {};
	let isValid = true;

	for (const { name, inputId, errorId } of VALIDATION_FIELDS) {
		if (!Object.prototype.hasOwnProperty.call(validationErrors, name)) {
			continue;
		}

		const field = getElement(inputId);
		const errorElement = getElement(errorId);
		const fieldError = validationErrors[name];
		const message = typeof fieldError === "string" ? fieldError : "";
		const hasError = message.length > 0;

		if (field) {
			field.classList.toggle("is-invalid", hasError);
			field.classList.toggle("is-valid", !hasError);
			field.setAttribute("aria-invalid", String(hasError));
		}
		if (errorElement) {
			errorElement.textContent = message;
		}

		if (hasError) {
			isValid = false;
		}
	}

	return isValid;
}

export function clearValidationErrors() {
	for (const { inputId, errorId } of VALIDATION_FIELDS) {
		const field = getElement(inputId);
		const errorElement = getElement(errorId);

		if (field) {
			field.classList.remove("is-invalid", "is-valid");
			field.removeAttribute("aria-invalid");
		}
		if (errorElement) {
			errorElement.textContent = "";
		}
	}
}

export function resetUI() {
	const loadingIndicator = getElement("request-status");
	const errorMessage = getElement("error-message");
	const responseSection = getElement("response-section");

	if (loadingIndicator) {
		loadingIndicator.hidden = true;
	}
	if (errorMessage) {
		errorMessage.textContent = "";
		errorMessage.hidden = true;
	}
	if (responseSection) {
		responseSection.hidden = true;
	}
	for (const id of ["response-text", "response-topic", "response-level", "response-integration"]) {
		const element = getElement(id);
		if (element) {
			element.textContent = "";
		}
	}

	clearValidationErrors();
}
