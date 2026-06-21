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

# Copy all backend code files and change ownership to user
COPY --chown=user:user . /app/

# Switch to the non-root user
USER user

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Run uvicorn server mapping to 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
