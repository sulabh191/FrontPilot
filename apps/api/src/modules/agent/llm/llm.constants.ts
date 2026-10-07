// Injection tokens for the language model. The agent asks for these instead of
// creating a client, so tests can inject a fake model and the provider can change.
export const LLM_CLIENT = Symbol("LLM_CLIENT");
export const LLM_MODEL = Symbol("LLM_MODEL");
