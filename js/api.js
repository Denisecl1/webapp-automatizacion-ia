import { WEBHOOK_URL } from "./config.js";

const REQUEST_TIMEOUT_MS = 30_000;
const RESPONSE_FIELDS = ["ok", "respuesta", "tema", "nivel", "integracion"];

export class ApiError extends Error {
	constructor(message, kind, status) {
		super(message);
		this.name = "ApiError";
		this.kind = kind;
		this.status = status;
	}
}

function createHttpError(status) {
	const messages = {
		400: "El Webhook rechazó los datos de la consulta (HTTP 400).",
		401: "El Webhook rechazó la autorización (HTTP 401). Revisa la configuración de n8n.",
		403: "El Webhook denegó la solicitud (HTTP 403). Revisa sus permisos y configuración en n8n.",
		429: "Se alcanzó el límite de solicitudes (HTTP 429). Espera antes de volver a intentarlo.",
		500: "El Webhook encontró un error interno (HTTP 500).",
		503: "El servicio no está disponible temporalmente (HTTP 503)."
	};
	const message = messages[status] ?? `El Webhook respondió con un error HTTP (${status}).`;

	return new ApiError(message, "http", status);
}

function hasExpectedResponse(data) {
	if (data === null || typeof data !== "object" || Array.isArray(data)) {
		return false;
	}

	if (!RESPONSE_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(data, field))) {
		return false;
	}

	return typeof data.ok === "boolean"
		&& typeof data.respuesta === "string"
		&& typeof data.tema === "string"
		&& typeof data.nivel === "string"
		&& typeof data.integracion === "string";
}

export async function sendQuestion(payload = {}) {
	const {
		tema = "",
		nivel = "",
		pregunta = "",
		integracion = ""
	} = payload ?? {};
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(WEBHOOK_URL, {
			method: "POST",
		headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tema, nivel, pregunta, integracion }),
			signal: controller.signal
		});

		if (!response.ok) {
			throw createHttpError(response.status);
		}

		let data;
		try {
			data = await response.json();
		} catch {
			throw new ApiError("El Webhook devolvió una respuesta que no es JSON válido.", "invalid-json");
		}

		if (!hasExpectedResponse(data)) {
			throw new ApiError("La respuesta del Webhook no tiene el formato esperado.", "invalid-response");
		}

		return data;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		if (error?.name === "AbortError") {
			throw new ApiError("La solicitud superó el tiempo de espera. Puedes volver a intentarlo.", "timeout");
		}

		throw new ApiError(
			"No se pudo conectar con el Webhook. Comprueba tu conexión y que n8n permita el origen de esta página mediante CORS.",
			"network"
		);
	} finally {
		clearTimeout(timeoutId);
	}
}
