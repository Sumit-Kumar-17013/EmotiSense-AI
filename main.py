import numpy as np
import re
import pickle
from fastapi import FastAPI , HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel , Field

from keras.models import load_model
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

from contextlib import asynccontextmanager

## Loading Data 
model_path = "Artifacts/BiGRU_Model.keras"  # 1. BiGRu 
tokenizer_path = "Artifacts/tokenizer.pkl"  # 2. tokenizer

max_sequence_length = 50 # MAx Length

emotion_labels = ["sadness", "joy", "love", "anger", "fear", "surprise"] #lables

Emotion_emojis = {   # Emojis
    "sadness": "😢",
    "joy": "😄",
    "love": "❤️",
    "anger": "😠",
    "fear": "😨",
    "surprise": "😲",
}

## Preprocessing the Upcoming data
def preprocessing_text(text: str )->str:
    text = text.lower()
    text = re.sub(r"'" ,"" , text)
    text = re.sub(r"[^a-z0-9\s]" , " " , text)
    text = re.sub(r"\s+" , " " , text).strip()

    return text

class TextInput(BaseModel):
    text : str = Field(..., min_length= 1 , max_length= 2000 , description = "The sentence to analyze" , json_schema_extra = {"example": "I feel so happy and excited"})


class PredictionResponse(BaseModel):
    text : str
    predicted_emotion : str
    confidence : float
    all_probabilites : dict[str , float]

class HealthResponse(BaseModel):
    status : str
    model_loaded : bool


## Model Loading And LifeSpan Management 
dl_model = {}

@asynccontextmanager
async def lifespan(app : FastAPI):
        print("Loading the Modle and Tokenizer")
        dl_model["BiGRU"] = load_model(model_path)
        with open(tokenizer_path , 'rb') as file: 
            dl_model['Tokenzier'] = pickle.load(file)

        print("Model and Tokenzier Load Successfully!!")

        yield

        dl_model.clear()

## Build APi
app = FastAPI(
    lifespan = lifespan
)

# Cros 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers = ["*"]
)

#Mount the static files to the FastAPI app
app.mount('/static' , StaticFiles(directory= 'static') , name = "static")

@app.get('/' , include_in_schema= False)
def Server_UI():
    return FileResponse('static/index.html')


@app.get('/health' , response_model= HealthResponse)
def health_check():
    return HealthResponse(
        status= "Server is Running",
        model_loaded= bool(dl_model)
    )

@app.post("/predict" , response_model = PredictionResponse)
def predict_emotion(text_input : TextInput):

    BiGRU_model = dl_model.get("BiGRU")
    tokenzier_model = dl_model.get("Tokenzier")

    cleaned_text = preprocessing_text(text_input.text)

    # Convert text into numerical sequences
    tokenized_text = tokenzier_model.texts_to_sequences([cleaned_text])

    # Pad the sequence
    padded_text = pad_sequences(
        tokenized_text,
        maxlen=max_sequence_length,
        padding="post",
        truncating="post"
    )


    probabilites = BiGRU_model.predict(padded_text)[0]

    top_emotion = int(np.argmax(probabilites))

    all_probabilites = {
        label : float(prob) for prob , label in zip(probabilites , emotion_labels)
    }

    return PredictionResponse(
        text = text_input.text,
        predicted_emotion = emotion_labels[top_emotion],
        confidence = float(probabilites[top_emotion]), 
        all_probabilites = all_probabilites
    )


