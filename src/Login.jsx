import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login = () => {
    const handleLoginSuccess = async (credentialResponse) => {
        // 구글이 준 토큰을 백엔드로 휙 던짐
        try {
            await axios.post('http://34.158.194.219:8000/auth/login', {
                credential: credentialResponse.credential
            }, { withCredentials: true }); //  쿠키를 받으려면 이거 필수!
            
            alert("로그인 성공!");
            window.location.href = "/"; // 메인으로 이동
        } catch (error) {
            alert("로그인 실패: 회사 계정이 맞나요?");
        }
    };

    return (
        <GoogleOAuthProvider clientId="아까_복사한_클라이언트_ID">
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
                <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={() => console.log('Login Failed')}
                />
            </div>
        </GoogleOAuthProvider>
    );
};
export default Login;