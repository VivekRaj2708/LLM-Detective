#!/bin/bash
#
#SBATCH --job-name=roberta_4class    # A descriptive name for your job
#SBATCH --output=logs/roberta_4class_%j.log # Combined output and error log file (%j is the job ID)
#SBATCH --partition=gpu           # Use the GPU partition
#SBATCH --gres=gpu:1             # Request 1 GPUs

# --- Setup ---
echo "Job started on $(hostname)"
echo "Job ID: $SLURM_JOB_ID"
date

# Navigate to the directory where you submitted the job
cd $SLURM_SUBMIT_DIR
echo "Current directory: $(pwd)"

# --- Load Anaconda and Activate Environment ---
# These lines are from your instructions
echo "Loading Anaconda..."
module load anaconda3-2024
source /apps/compilers/anaconda3-2024/etc/profile.d/conda.sh

# Activate your specific environment
echo "Activating conda environment: llama"
conda activate llama

# Verify which python and packages are being used
which python
pip list

# --- Run Your Python Script ---
echo "Starting Python inference script..."
python main.py \
--file_path /home/harinarayan.j/LLM-DetectAIve/script/samples_converted.jsonl \
--out_path outputs/ \
--model_name FacebookAI/roberta-base \
--num_labels 4 \ 
--sample_frac 0.8
--num_trials 10 \
--num_epochs 5 \

echo "Python script finished."

# --- Cleanup ---
conda deactivate
date
echo "Job finished."
