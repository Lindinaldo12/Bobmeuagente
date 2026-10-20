"""
ai_client.py — Camada de abstração para múltiplos provedores de IA.

Propósito:
  - Permite que o bot fale com mais de um provedor de IA.
  - Faz fallback automático: se o provedor principal cair (ex: rate limit da
    Gemini ou 429), tenta o próximo disponível.
  - Mantém o restante do código (handlers) independente de qual provedor está
    ativo, eliminando o "hardcode" do modelo de IA.

Provedores suportados:
  1. Gemini  — google-genai (padrão atual, prioridade 1)
  2. OpenRouter — openai (unified API, vários modelos, prioridade 2)
                 https://openrouter.ai/api/v1

Como adicionar um novo provedor:
  1. Crie uma classe que herda de `AIProvider`.
  2. Implemente `_init_client()` e `generate(...)`.
  3. Adicione-a ao `AIProviderManager._load_providers()`.
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    """Erro lançado quando nenhum provedor consegue gerar a resposta."""
    pass


class AIProvider:
    """Abstração base de um provedor de IA."""

    def __init__(self, name: str, api_key: str, base_url: Optional[str] = None):
        self.name = name
        self.api_key = api_key
        self.base_url = base_url
        self.client = None
        self._init_client()

    def _init_client(self):
        """Subclasse deve inicializar self.client."""
        raise NotImplementedError

    def generate(self, model: str, system_prompt: str, user_prompt: str) -> str:
        """Retorna a resposta do modelo como string."""
        raise NotImplementedError

    def is_available(self) -> bool:
        return self.client is not None

    def __repr__(self):
        return f"<{self.__class__.__name__} name={self.name}>"


class GeminiProvider(AIProvider):
    """Provedor Google Gemini via google-genai."""

    def _init_client(self):
        try:
            from google import genai
        except ImportError:
            logger.warning("biblioteca 'google-genai' não instalada")
            self.client = None
            return
        try:
            genai.configure(api_key=self.api_key)
            self.client = genai
        except Exception as exc:
            logger.error("Falha ao inicializar Gemini: %s", exc)
            self.client = None

    def generate(self, model: str, system_prompt: str, user_prompt: str) -> str:
        if self.client is None:
            raise AIProviderError("Gemini não está disponível")
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=f"{system_prompt}\n\nUser: {user_prompt}\nJARVIS:"
            )
            return response.text
        except Exception as exc:
            raise AIProviderError(f"Erro no Gemini: {exc}")


class OpenRouterProvider(AIProvider):
    """Provedor OpenRouter (API compatível com OpenAI)."""

    def _init_client(self):
        try:
            from openai import OpenAI
        except ImportError:
            logger.warning("biblioteca 'openai' não instalada")
            self.client = None
            return
        try:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url or "https://openrouter.ai/api/v1",
            )
        except Exception as exc:
            logger.error("Falha ao inicializar OpenRouter: %s", exc)
            self.client = None

    def generate(self, model: str, system_prompt: str, user_prompt: str) -> str:
        if self.client is None:
            raise AIProviderError("OpenRouter não está disponível")
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=2048,
            )
            content = response.choices[0].message.content
            if content is None:
                raise AIProviderError("Resposta vazia do provedor")
            return content
        except Exception as exc:
            raise AIProviderError(f"Erro no OpenRouter: {exc}")


class AIProviderManager:
    """Gerenciador de provedores com fallback automático."""

    def __init__(self):
        self.providers = []
        self._load_providers()

    def _load_providers(self):
        # Prioridade 1 — Gemini (padrão atual)
        gemini_key = os.environ.get("GOOGLE_API_KEY")
        if gemini_key:
            self.providers.append(GeminiProvider("gemini", gemini_key))

        # Prioridade 2 — OpenRouter (grupo, modelos via OpenRouter)
        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            self.providers.append(
                OpenRouterProvider(
                    "openrouter",
                    openrouter_key,
                    base_url="https://openrouter.ai/api/v1",
                )
            )

    def generate(self, model: str, system_prompt: str, user_prompt: str) -> str:
        """Gera uma resposta tentando cada provedor em ordem até acertar."""
        last_error = None
        for provider in self.providers:
            try:
                if provider.is_available():
                    return provider.generate(model, system_prompt, user_prompt)
            except AIProviderError as exc:
                last_error = exc
                logger.warning("Provedor %s falhou: %s", provider.name, exc)
                continue

        raise AIProviderError(
            "Nenhum provedor de IA disponível. "
            f"Erros: {last_error}"
        )


# Instância global — carregada uma única vez (não é thread-safe, mas ouve
# apenas no loop de eventos do bot).
ai_client = AIProviderManager()
