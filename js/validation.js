const TEMAS_VALIDOS = [
	"Inteligencia artificial",
	"Redes",
	"Programación",
	"Bases de datos",
	"Internet de las cosas (IoT)"
];

const NIVELES_VALIDOS = ["Básico", "Intermedio", "Avanzado"];
const INTEGRACIONES_VALIDAS = ["nativo", "http"];

function validarOpcion(value, opciones, nombreCampo, nombreOpcion) {
	if (typeof value !== "string") {
		return {
			value: "",
			error: value == null
				? `${nombreCampo} es obligatorio.`
				: `${nombreCampo} debe ser texto.`
		};
	}

	const normalizedValue = value.trim();

	if (!normalizedValue) {
		return { value: "", error: `${nombreCampo} es obligatorio.` };
	}

	if (!opciones.includes(normalizedValue)) {
		return { value: normalizedValue, error: `Selecciona ${nombreOpcion}.` };
	}

	return { value: normalizedValue, error: null };
}

export function validateTema(value) {
	return validarOpcion(value, TEMAS_VALIDOS, "El tema", "un tema válido");
}

export function validateNivel(value) {
	return validarOpcion(value, NIVELES_VALIDOS, "El nivel", "un nivel válido");
}

export function validatePregunta(value) {
	if (typeof value !== "string") {
		return {
			value: "",
			error: value == null ? "La pregunta es obligatoria." : "La pregunta debe ser texto."
		};
	}

	const normalizedValue = value.trim().replace(/\s+/gu, " ");

	if (!normalizedValue) {
		return { value: "", error: "La pregunta es obligatoria." };
	}

	if (normalizedValue.length < 10) {
		return { value: normalizedValue, error: "La pregunta debe tener al menos 10 caracteres." };
	}

	if (normalizedValue.length > 500) {
		return { value: normalizedValue, error: "La pregunta no puede superar 500 caracteres." };
	}

	return { value: normalizedValue, error: null };
}

export function validateIntegracion(value) {
	return validarOpcion(value, INTEGRACIONES_VALIDAS, "La integración", "una integración válida");
}

export function validateForm(formValues) {
	const source = formValues && typeof formValues === "object" ? formValues : {};
	const tema = validateTema(source.tema);
	const nivel = validateNivel(source.nivel);
	const pregunta = validatePregunta(source.pregunta);
	const integracion = validateIntegracion(source.integracion);

	const values = {
		tema: tema.value,
		nivel: nivel.value,
		pregunta: pregunta.value,
		integracion: integracion.value
	};

	const errors = {
		tema: tema.error,
		nivel: nivel.error,
		pregunta: pregunta.error,
		integracion: integracion.error
	};

	return {
		isValid: Object.values(errors).every((error) => error === null),
		values,
		errors
	};
}
