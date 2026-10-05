import json
from flask import Flask, request
from comtele_sdk.blacklist-service import BlacklistService

app = Flask(__name__)

@app.route("/sms/", method=['POST'])
def hello():
	data = json.loads(request.data)
	answer = data.get('ReceivedContent').upper()
	if answer == 'PARAR':
		blacklist-service = BlacklistService('__api_key');		//Insert here your api key
		result = blacklist-service.insert(data.get('Sender'));	// Number that to be insert in blacklist
	return "Ok!"