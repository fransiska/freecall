- Use WebRTC to call between 2 html page (one's answerer, one's index) without signalling server
- Tested with python 3.7.3, Brave v1.35.104 on Mac OS and Safari on iPhone
- iPhone requires https, so use `python simple-https-server.py` to run dummy https server
  - Generate keys first by `openssl req -new -x509 -keyout key.pem -out server.pem -days 365 -nodes`
- Brave doesn't want to open the above https, so another server is run by `python -m http.server`

### Signaling

1. Press start then call on the one opening the index (offerer)
2. Copy the `{"type":"offer"...`
3. Press start then answer on the one opening the answer (answerer)
4. Paste (2) on the popup
5. Copy the resulting answer `{"sdp":...` on the answerer
6. Paste it to the Input desc in remote on the offerer and click setRemote
7. Copy ICE Candidates from offerer
8. Paste on answerer and click add ice
   - It should be working already at this stage
9. Paste ICE Candidates from answerer
10. Paste on offerer and click add ice
