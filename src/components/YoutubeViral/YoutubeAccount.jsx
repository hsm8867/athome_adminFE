import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Typography, Row, Col, Statistic, Tag, message } from 'antd';
import { YoutubeOutlined, UserOutlined, LogoutOutlined, GoogleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const YoutubeAccount = () => {
  // 로그인 상태 관리 (실제로는 API 연동 필요)
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [channelInfo, setChannelInfo] = useState(null);

  // [시뮬레이션] 컴포넌트 마운트 시 토큰 체크 로직이 들어갈 곳
  useEffect(() => {
    // const token = localStorage.getItem('youtube_token');
    // if (token) { ... }
  }, []);

  // 1. 계정 연동 핸들러 (로그인 시뮬레이션)
  const handleConnect = () => {
    setLoading(true);
    
    // 💡 실제로는 여기서 백엔드 OAuth URL로 이동해야 합니다.
    // window.location.href = 'http://34.64.158.35:8000/auth/login';

    // (테스트용) 1.5초 뒤 로그인 성공 처리
    setTimeout(() => {
      setChannelInfo({
        title: "AtHome Official",
        handle: "@athome_korea",
        subscribers: 125000,
        views: 4502000,
        videoCount: 85,
        thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" // 예시 이미지
      });
      setIsConnected(true);
      setLoading(false);
      message.success('YouTube 계정이 성공적으로 연동되었습니다!');
    }, 1000);
  };

  // 2. 연동 해제 핸들러
  const handleDisconnect = () => {
    setIsConnected(false);
    setChannelInfo(null);
    message.info('계정 연동이 해제되었습니다.');
  };

  // --- 화면 렌더링 ---

  // Case 1: 연동되지 않았을 때 (로그인 화면)
  if (!isConnected) {
    return (
      <div style={{ marginTop: 20 }}>
        <Card 
          bordered={false} 
          style={{ 
            height: '500px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            textAlign: 'center',
            backgroundColor: '#fff'
          }}
        >
          <div style={{ maxWidth: 400 }}>
            <div style={{ marginBottom: 24 }}>
                <YoutubeOutlined style={{ fontSize: '70px', color: '#ff0000' }} />
            </div>
            <Title level={3}>YouTube 계정 연동</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: '15px' }}>
              유튜브 채널을 분석하고 댓글을 관리하려면<br />
              Google 계정으로 로그인하여 권한을 허용해주세요.
            </Text>
            <Button 
              type="primary" 
              size="large" 
              icon={<GoogleOutlined />} 
              onClick={handleConnect}
              loading={loading}
              style={{ 
                backgroundColor: '#DB4437', 
                borderColor: '#DB4437', 
                width: '100%', 
                height: '50px', 
                fontSize: '16px',
                borderRadius: '8px'
              }}
            >
              Google 계정으로 계속하기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Case 2: 연동되었을 때 (대시보드 정보)
  return (
    <div style={{ marginTop: 20 }}>
      {/* 1. 상단 프로필 카드 */}
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: '12px' }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col>
            <Avatar 
                size={100} 
                src={channelInfo.thumbnail} 
                icon={<UserOutlined />} 
                style={{ border: '2px solid #f0f0f0' }}
            />
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ marginBottom: 4 }}>{channelInfo.title}</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>{channelInfo.handle}</Text>
            <div style={{ marginTop: 12 }}>
                <Tag color="red">YouTube Partner</Tag>
                <Tag color="green">인증된 계정</Tag>
            </div>
          </Col>
          <Col>
            <Button danger icon={<LogoutOutlined />} onClick={handleDisconnect}>
              연동 해제
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 2. 하단 통계 카드들 */}
      <Row gutter={24}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic 
              title="구독자 수" 
              value={channelInfo.subscribers} 
              prefix={<UserOutlined />} 
              suffix="명" 
              valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic 
              title="총 조회수" 
              value={channelInfo.views} 
              prefix={<YoutubeOutlined />} 
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic 
              title="업로드한 영상" 
              value={channelInfo.videoCount} 
              suffix="개" 
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default YoutubeAccount;