from flask import Flask, redirect, url_for, session, render_template_string, request, flash
from flask_sqlalchemy import SQLAlchemy
from requests_oauthlib import OAuth2Session
from ldap3 import Server, Connection, ALL, NTLM
import os
import jwt  

app = Flask(__name__)
app.secret_key = os.urandom(24)

# การตั้งค่าฐานข้อมูล
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

# การตั้งค่า OAuth2
client_id = '4b7d0530-9dde-4634-878b-07fa1xxxxxxx'
client_secret = 'lhWEfX7phWE2FEUjBGWeriKMnAKaDsaHvu_xxxxx'
authorization_base_url = 'https://authsso.mfu.ac.th/adfs/oauth2/authorize'
token_url = 'https://authsso.mfu.ac.th/adfs/oauth2/token'
redirect_uri = 'https://poc-xxxxx.mfu.ac.th/authorize'

# การตั้งค่า Active Directory
AD_SERVER = '192.168.14.1x'
AD_BASE_DN = 'DC=mfu,DC=ac,DC=th'
AD_USERNAME = 'mfu\\xxx'
AD_PASSWORD = 'xxxxxxx'

# HTML Template สำหรับหน้า Landing Page
LANDING_PAGE_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .login-container {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
        }
        input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            font-size: 1rem;
        }
        button:hover {
            background-color: #0056b3;
        }
        .error {
            color: red;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h2 style="text-align: center; margin-bottom: 2rem;">Login</h2>
        {% if error %}
        <div class="error">{{ error }}</div>
        {% endif %}
        <form method="POST" action="{{ url_for('check_username') }}">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <button type="submit">Continue</button>
        </form>
    </div>
</body>
</html>
'''

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)

def check_user_in_ad(username):
    try:
        # เพิ่มโดเมนหากไม่ได้ใส่เข้ามา
        if "@" not in username:
            username += "@mfu.ac.th"
        server = Server(AD_SERVER, get_info=ALL)
        conn = Connection(
            server,
            user=AD_USERNAME,
            password=AD_PASSWORD,
            authentication=NTLM,
            auto_bind=True
        )
        search_filter = f"(userPrincipalName={username})"
        conn.search(AD_BASE_DN, search_filter, attributes=['userPrincipalName'])
        return len(conn.entries) > 0
    except Exception as e:
        print(f"LDAP Error: {e}")
        return False

@app.route('/')
def index():
    if 'user' in session:
        return f"Hello, {session['user']['name']}! Welcome to the system."
    else:
        return redirect(url_for('landing'))

@app.route('/landing')
def landing():
    error = request.args.get('error')
    return render_template_string(LANDING_PAGE_TEMPLATE, error=error)

@app.route('/check_username', methods=['POST'])
def check_username():
    username = request.form.get('username')
    if check_user_in_ad(username):
        session['username'] = username
        return redirect(url_for('login'))
    else:
        return redirect(url_for('landing', error='ไม่พบชื่อผู้ใช้ใน Active Directory'))

@app.route('/login')
def login():
    if 'username' not in session:
        return redirect(url_for('landing'))
    
    oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
    authorization_url, state = oauth.authorization_url(authorization_base_url, login_hint=session['username'])
    
    session['oauth_state'] = state
    print(f"Generated OAuth state: {state}")
    
    return redirect(authorization_url)

@app.route('/authorize')
def authorize():
    oauth = OAuth2Session(client_id, state=session.get('oauth_state'), redirect_uri=redirect_uri)
    print(f"Authorization Response URL: {request.url}")

    try:
        token = oauth.fetch_token(
            token_url,
            authorization_response=request.url,
            client_secret=client_secret,
            client_id=client_id,
            include_client_id=True,
            scope=['openid', 'email', 'profile']
        )
        print(f"Token received: {token}")

        userinfo_response = oauth.get('https://authsso.mfu.ac.th/adfs/userinfo', headers={'Authorization': f"Bearer {token['access_token']}"})
        print(f"Raw userinfo response: {userinfo_response.text}")

        # หากไม่ได้ข้อมูลจาก userinfo ให้ใช้ id_token แทน
        if userinfo_response.status_code != 200 or not userinfo_response.text:
            print("No userinfo response, decoding id_token")
            decoded_id_token = jwt.decode(token['id_token'], options={"verify_signature": False})
            userinfo = {
                'name': decoded_id_token.get('name', 'Unknown'),
                'email': decoded_id_token.get('upn', '')
            }
        else:
            userinfo = userinfo_response.json()

        print(f"User Info received: {userinfo}")

        # ตรวจสอบและบันทึกผู้ใช้
        if userinfo:
            user = User.query.filter_by(email=userinfo['email']).first()
            if not user:
                user = User(name=userinfo.get('name', 'Unknown'), email=userinfo['email'])
                db.session.add(user)
                db.session.commit()

            session['user'] = {'name': user.name, 'email': user.email}
            return redirect(url_for('index'))
        else:
            return redirect(url_for('landing', error="Failed to retrieve user info"))

    except Exception as e:
        print(f"OAuth Error: {e}")
        return redirect(url_for('landing', error="OAuth2 Authentication failed"))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=443, ssl_context=('wildcard_mfu_ac_th.crt', 'wildcard_mfu_ac_th.key'), debug=True)
