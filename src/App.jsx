import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Typography, message } from 'antd';
import axios from 'axios';
import { 
  HomeOutlined, 
  UserOutlined, 
  RocketOutlined, 
  DollarOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined
} from '@ant-design/icons';

// 컴포넌트 import
// InfluencerTable이 이제 3개의 탭(소팅/자동화/트래킹)을 모두 가지고 있는 페이지입니다.
import InfluencerTable from './InfluencerTable';
import YoutubeAccount from './YoutubeAccount';
import YoutubeDashboard from './YoutubeDashboard';
import CreatedComments from './CreatedComments';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(localStorage.getItem('lastSelectedKey') || 'home');
  
  // 댓글 페이지 상태 관리
  const [selectedVideoKey, setSelectedVideoKey] = useState(null);

  const API_BASE_URL = 'http://34.64.158.35:8000';
  const [videos, setVideos] = useState([]);
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/videos`);
      const formattedData = response.data.map(v => ({
        key: v.id,
        title: v.title,
        url: v.url,
        status: v.status,
        ...v
      }));
      setVideos(formattedData);
    } catch (error) {
      console.error("영상 목록 로딩 실패:", error);
      message.error("영상 데이터를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    localStorage.setItem('lastSelectedKey', selectedKey);
  }, [selectedKey]);

  const handleGoToComments = (record) => {
    setSelectedVideoKey(record.key); 
    setSelectedKey('yt_comment_list'); 
  };

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  // ✅ [수정 1] 메뉴 구조 간소화
  // 3단계(인플루언서 마케팅 > 무상 시딩 > 선별)에서 -> 2단계(인플루언서 마케팅 > 무상 시딩)로 변경
  const items = [
    { key: 'home', icon: <HomeOutlined />, label: '홈' },
    {
      key: 'influencer_marketing', icon: <UserOutlined />, label: '인플루언서 마케팅',
      children: [
        // children을 없애고 바로 연결합니다.
        { key: 'paid_seeding', label: '유상 시딩' }, 
        { key: 'unpaid_seeding', label: '무상 시딩' }
      ]
    },
    {
      key: 'youtube comment viral', icon: <UserOutlined />, label: '유튜브 댓글 바이럴',
      children: [
        { key: 'youtube_account', label: '유튜브 계정' },
        { key: 'yt_comment_list', label: '생성된 댓글' },
        { key: 'youtube_comment_prompt', label: '프롬프트' },
        { key: 'youtube_dashboard', label: '댓글 업로드 대시보드' }
      ]
    },
    { 
        key: 'performance_marketing', 
        icon: <RocketOutlined />, 
        label: '퍼포먼스 마케팅' 
    },
    { 
        key: 'pl_management', 
        icon: <DollarOutlined />, 
        label: 'P/L 관리' 
    },
  ];

  // ✅ [수정 2] 렌더링 로직 연결
  const renderContent = () => {
    switch (selectedKey) {
      case 'home':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>홈 대시보드</Title></div>;
      
      // ✅ 유상 시딩 & 무상 시딩 모두 'InfluencerTable' (3개 탭 있는 페이지)을 보여줍니다.
      case 'paid_seeding':
        return <InfluencerTable />; 
        
      case 'unpaid_seeding':
        return <InfluencerTable />;
        
      case 'youtube_account':
        return <YoutubeAccount />;

      case 'yt_comment_list':
        return (
          <CreatedComments 
            data={videos} 
            selectedVideoKey={selectedVideoKey} 
            onSelectVideo={setSelectedVideoKey} 
          />
        );

      case 'youtube_dashboard':
        return (
          <YoutubeDashboard 
            data={videos} 
            onGoToComments={handleGoToComments} 
          />
        );

      case 'youtube_comment_prompt':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>프롬프트 준비 중</Title></div>;
      
      case 'performance_marketing':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>퍼포먼스 마케팅 페이지</Title></div>;
        
      case 'pl_management':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>P/L 관리 페이지</Title></div>;

      default:
        return <div>페이지를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={250}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]} 
          defaultOpenKeys={['influencer_marketing', 'youtube comment viral']}
          items={items}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
            <div onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '18px', padding: '0 24px', cursor: 'pointer' }}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {renderContent()}
        </Content>
        <Footer style={{ textAlign: 'center' }}>AtHome Admin ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  );
};

export default App;