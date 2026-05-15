# Use a lightweight Python base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /code

# Install system dependencies (just in case YOLO needs them)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy your requirements and install them
COPY ./requirements.txt /code/requirements.txt# Use a lightweight Python base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /code

# 🔥 FIX: Install the system graphics libraries that the full OpenCV requires
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Copy your requirements and install them
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Hugging Face requires the app to run as a non-root user
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Move into the user's home directory and copy your code
WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# Tell Hugging Face which port to expose
EXPOSE 7860

# Command to run your Flask app
CMD ["python", "app.py"]
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Hugging Face requires the app to run as a non-root user
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Move into the user's home directory and copy your code
WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# Tell Hugging Face which port to expose
EXPOSE 7860

# Command to run your Flask app
CMD ["python", "app.py"]