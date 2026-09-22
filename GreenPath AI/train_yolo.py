from ultralytics import YOLO
import sys
import torch

def main():
    print(f"CUDA available: {torch.cuda.is_available()}")
    try:
        # Load a model
        model = YOLO("yolo11n.pt")  # load a pretrained model
        
        # Train the model
        print("Starting training...")
        results = model.train(
            data=r"C:\Users\Ganesh\OneDrive\Desktop\waste\data.yaml",
            epochs=100,
            imgsz=640,
            batch=-1,  # Auto batch size
            optimizer="auto",
            cache=True,
            amp=True,
            patience=20,
            save=True,
            project="waste_detection",
            name="yolo11_nano_custom",
            exist_ok=True
        )
        print("Training completed successfully!")
    except Exception as e:
        print(f"Error during training: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
