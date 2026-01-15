import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message } from 'antd';
import axios from 'axios'; // npm install axios 필요

const YoutubeAccount = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // [설정] 백엔드 API 주소 (환경변수로 빼는 것이 좋음)
  const API_BASE_URL = 'http://34.64.158.35:8000'; 
  // 실제 배포 시에는 작성자님의 서버 IP나 도메인 입력

  // 1. 데이터 불러오기 함수 (FastAPI 연동)
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // 백엔드에서 DB 데이터를 가져옵니다.
      const response = await axios.get(`${API_BASE_URL}/youtube/accounts`);
      
      // 받아온 데이터에 key 값(antd 테이블 필수)을 넣어줍니다.
      const formattedData = response.data.map((item) => ({
        key: item.id, // DB의 id를 key로 사용
        ...item,
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      message.error('계정 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 컴포넌트 마운트 시 데이터 조회 실행
  useEffect(() => {
    fetchAccounts();
  }, []);

  // 3. 구글 로그인 핸들러 (FastAPI OAuth 엔드포인트로 리다이렉트)
  const handleLogin = (email) => {
    // 백엔드에 "이 이메일로 로그인 시작할게"라고 요청하거나,
    // 바로 구글 로그인 페이지로 리다이렉트 시킵니다.
    // state 파라미터에 email을 태워서 보내면, 콜백 때 누구 계정인지 알 수 있습니다.
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // 백엔드 prefix가 '/oauth/google' 이고 엔드포인트가 '/login' 이므로 아래와 같이 조합됩니다.
    const loginUrl = `${API_BASE_URL}/oauth/google/login?email=${encodeURIComponent(email)}`;

    message.loading(`${email} 계정의 구글 연동을 시작합니다...`, 1);

    window.open(
      loginUrl,
      'GoogleLoginPopup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Onboarding Status',
      dataIndex: 'onboarding_status', // DB 컬럼명: onboarding_status (0 or 1)
      key: 'onboarding_status',
      render: (status) => {
        // DB에 0(ready), 1(onboard)로 저장되어 있다고 가정
        // 만약 DB에서 문자열('ready')로 준다면 로직 수정 필요
        const isReady = status === 0 || status === 'ready'; 
        const isOnboard = status === 1 || status === 'onboard';

        let color = isOnboard ? 'green' : 'geekblue';
        let text = isOnboard ? 'ONBOARD' : 'READY';

        return (
          <Tag color={color} key={text}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? text.split('T')[0] : '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        // status가 0(ready)이거나 문자열 'ready'일 때만 버튼 노출
        const isReady = record.onboarding_status === 0 || record.onboarding_status === 'ready';
        
        return (
          <Space size="middle">
            {isReady ? (
              <Button type="primary" onClick={() => handleLogin(record.email)}>
                Google Login
              </Button>
            ) : (
              <span style={{ color: '#aaa' }}>연동 완료</span>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>유튜브 계정 관리</h3>
        <Button onClick={fetchAccounts} loading={loading}>새로고침</Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={{ pageSize: 10 }} 
        loading={loading} // 로딩 스피너 표시
      />
    </div>
  );
};

export default YoutubeAccount;