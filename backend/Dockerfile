# Use a slim Python runtime as parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV PORT=7860

WORKDIR /app

# Create a non-root user with UID 1000
RUN useradd -m -u 1000 user || true

# Copy and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Create package structure, set ownership, and copy all backend code files into 'backend' folder
RUN mkdir -p /app/backend && touch /app/backend/__init__.py && chown -R user:user /app
COPY --chown=user:user . /app/backend/

# Switch to the non-root user
USER user

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Run uvicorn server mapping to backend.main:app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
