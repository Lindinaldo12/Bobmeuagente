#!/usr/bin/env python3
"""Flashcard management for the Telegram bot.

Provides flashcard persistence (JSON file) and a conversational quiz with
scoring, so the bot can answer "adicionar flashcard pergunta resposta",
"listar flashcards", "testar flashcards", etc. without routing through the
agent planner.

The public surface is a single callable::

    result = flashcards_tool(prompt: Optional[str] = None) -> str

returning a JSON string with ``success``/``error`` (and either a payload or a
friendly message) so the Telegram adapter can reason on it uniformly with the
other tools.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any, Optional

log = logging.getLogger(__name__)

# Persistent store (JSON). Kept next to the package so it ships with the repo;
# each bot profile can point ``STORE_PATH`` at its own file if desired.
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_STORE_PATH = BASE_DIR / "flashcards.json"
STORE_PATH = os.environ.get("FLASHCARDS_STORE", str(DEFAULT_STORE_PATH))

# Minimum length of a question (spammy single-word entries are rejected).
MIN_QUESTION_CHARS = 3
# Maximum number of flashcards persisted (guard against unbounded growth).
MAX_CARDS = 500


def _load() -> dict[str, Any]:
    if not Path(STORE_PATH).exists():
        return {"cards": {}, "scores": {}, "updated_at": None}
    try:
        with open(STORE_PATH, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (json.JSONDecodeError, OSError) as exc:
        log.warning("[flashcards] failed to load store %s: %s", STORE_PATH, exc)
        return {"cards": {}, "scores": {}, "updated_at": None}


def _save(store: dict[str, Any]) -> None:
    try:
        Path(STORE_PATH).parent.mkdir(parents=True, exist_ok=True)
        with open(STORE_PATH, "w", encoding="utf-8") as handle:
            json.dump(store, handle, ensure_ascii=False, indent=2)
        store["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    except OSError as exc:
        log.warning("[flashcards] failed to save store %s: %s", STORE_PATH, exc)


def _new_id() -> str:
    return str(int(time.time() * 1000) % 10**8)


def _parse_add(prompt: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Parse ``'adicionar pergunta resposta'`` (or ``'add question answer'``).

    Returns ``(question, answer, error)`` where one of the strings is a friendly
    error when the prompt is malformed. The answer is the LAST whitespace-delimited
    token so ``adicionar qual e a sua cor? azul`` yields question ``qual e a sua
    cor?`` and answer ``azul``.
    """
    if not prompt:
        return None, None, "Uso: /flashcards adicionar pergunta resposta"
    parts = re.split(r"\s+", prompt.strip(), maxsplit=1)
    if len(parts) < 2 or parts[0].lower() not in {"adicionar", "add", "nova", "new"}:
        return None, None, "Comando inválido. Use: /flashcards adicionar pergunta resposta"
    rest = parts[1]
    last_space = rest.rfind(" ")
    if last_space == -1:
        return None, None, "Use: /flashcards adicionar pergunta resposta"
    question = rest[:last_space]
    answer = rest[last_space + 1:]
    if len(question) < MIN_QUESTION_CHARS:
        return None, None, "A pergunta deve ter mais de 2 caracteres."
    return question, answer, None


def _parse_score(prompt: str) -> tuple[Optional[str], int, Optional[str]]:
    """Parse ``'score <id> <0-10>'`` or ``'score <id> <0-10> comentario'``.

    Returns ``(card_id, score, error)`` where one of the values is a friendly
    error when the prompt is malformed. The score is the numeric prefix of the
    third token (e.g. ``8`` in ``'8 comentario'``).
    """
    if not prompt:
        return None, 0, "Uso: /flashcards score <id> <nota 0-10>"
    parts = re.split(r"\s+", prompt.strip(), maxsplit=2)
    if len(parts) < 2 or parts[0].lower() not in {"score", "nota"}:
        return None, 0, "Comando inválido. Use: /flashcards score <id> <nota 0-10>"
    card_id = parts[1]
    if len(parts) < 3:
        score = 5
    else:
        score_match = re.match(r"(\d+)", parts[2])
        if not score_match:
            return None, 0, "Nota deve ser um número."
        score = int(score_match.group(1))
        if not 0 <= score <= 10:
            return None, 0, "Nota deve estar entre 0 e 10."
    return card_id, score, None


def flashcards_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the flashcard operation result.

    Supported prompts (space-separated, English or Portuguese keywords)::

        adicionar pergunta resposta            add question answer
        listar                                list
        testar [quantidade]                   quiz [count]
        score <id> <nota 0-10> [comentario]  grade <id> score

    Result shape::

        {"success": true, "cards": N, "updated_at": "...", "...": "..."}
        {"success": false, "error": "..."}
    """
    store = _load()
    cards = store.setdefault("cards", {})
    scores = store.setdefault("scores", {})

    if not prompt:
        # No prompt: default to listing.
        return _json_success(payload=_list_payload(cards, scores))

    parts = re.split(r"\s+", prompt.strip(), maxsplit=1)
    command = parts[0].lower()

    # --- Add a card ---
    if command in {"adicionar", "add", "nova", "new", "criar"}:
        question, answer, error = _parse_add(prompt)
        if error:
            return json.dumps({"success": False, "error": error})
        if question in cards:
            return json.dumps({"success": False, "error": "Já existe um flashcard com essa pergunta."})
        card_id = _new_id()
        cards[question] = {"id": card_id, "question": question, "answer": answer, "added_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        store["cards"] = cards
        _save(store)
        return _json_success(
            payload={
                "message": "Flashcard adicionado.",
                "id": card_id,
                "question": question,
                "total": len(cards),
            }
        )

    # --- List cards ---
    if command in {"listar", "list", "mostrar", "ver"}:
        return _json_success(payload=_list_payload(cards, scores))

    # --- Quiz / test ---
    if command in {"testar", "test", "quiz", "questoes", "questionarios"}:
        count = 5
        if len(parts) > 1:
            try:
                count = int(parts[1])
            except ValueError:
                return json.dumps({"success": False, "error": "Quantidade deve ser um número."})
        return _quiz_payload(cards, scores, count)

    # --- Score a card ---
    if command in {"score", "nota", "avaliar"}:
        card_id, score, error = _parse_score(prompt)
        if error:
            return json.dumps({"success": False, "error": error})
        # Accept the list number (n) OR the card id.
        all_questions = sorted(cards.items(), key=lambda kv: kv[1].get("added_at", ""))
        if card_id.isdigit():
            n = int(card_id)
            if 1 <= n <= len(all_questions):
                question = all_questions[n - 1][0]
            else:
                return json.dumps({"success": False, "error": "Número de flashcard inválido."})
        else:
            question = next((q for q, c in cards.items() if c.get("id") == card_id), None)
            if not question:
                return json.dumps({"success": False, "error": "ID de flashcard não encontrado."})
        scores[question] = scores.get(question, {})
        scores[question]["last_score"] = score
        scores[question]["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        store["cards"] = cards
        store["scores"] = scores
        _save(store)
        return _json_success(payload={"message": f"Nota {score}/10 gravada para '{cards[question]['question']}'. "})

    return json.dumps({"success": False, "error": f"Comando desconhecido: '{command}'. Use adicionar, listar, testar, score."})


def _json_success(payload: dict[str, Any]) -> str:
    payload["success"] = True
    return json.dumps(payload)


def _list_payload(cards: dict[str, Any], scores: dict[str, Any]) -> dict[str, Any]:
    total = len(cards)
    # Average score over cards that have been scored.
    scored = [c for c in scores.values() if c.get("last_score")]
    avg = round(sum(c["last_score"] for c in scored) / len(scored), 2) if scored else None
    list_cards = []
    for i, (question, card) in enumerate(sorted(cards.items(), key=lambda kv: kv[1].get("added_at", ""))[:15], start=1):
        card_id = card.get("id")
        score = scores.get(question, {}).get("last_score")
        list_cards.append(
            {
                "n": i,
                "id": card_id,
                "question": question,
                "score": score,
                "answered": card.get("answer", "").lower(),
            }
        )
    return {"total": total, "average": avg, "cards": list_cards}


def _quiz_payload(cards: dict[str, Any], scores: dict[str, Any], count: int) -> str:
    if not cards:
        return json.dumps({"success": True, "message": "Nenhum flashcard cadastrado. Use /flashcards adicionar pergunta resposta."})
    # Pick a deterministic sample, preferring unscored cards first.
    unscored = [q for q, c in cards.items() if not scores.get(q, {}).get("last_score")]
    scored = [q for q, c in cards.items() if scores.get(q, {}).get("last_score")]
    pool = unscored + scored
    sample = pool[:count] if len(pool) >= count else pool
    questions = []
    for q in sample:
        questions.append({"id": cards[q].get("id"), "question": q, "answer": cards[q].get("answer", "")})
    return _json_success(payload={"count": len(questions), "questions": questions})


def get_store_path() -> str:
    """Return the resolved flashcard store path (for display/help)."""
    return os.path.abspath(STORE_PATH)
