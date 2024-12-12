# Use an official Python runtime as a parent image
FROM python:3.10

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && apt-get clean
# Create a virtual environment
RUN python -m venv .venv

# Activate the virtual environment and install Python dependencies
COPY requirements.txt .
RUN ./.venv/bin/pip install --no-cache-dir -r requirements.txt opencv-python-headless

# Copy the application code
COPY ./backend/ ./backend/
COPY .env .

# Expose the port FastAPI is running on
EXPOSE 8000


CMD ["/bin/bash", "-c", "source .venv/bin/activate && gunicorn backend.app:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120"]

# Keep the container running for debugging
# CMD ["tail", "-f", "/dev/null"]