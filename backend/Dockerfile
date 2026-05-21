FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_INDEX_URL=https://pypi.org/simple/

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev

COPY src/ ./src/

RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
