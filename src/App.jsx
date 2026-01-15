import React, { useState, useEffect, useMemo } from 'react';
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
import InfluencerTable from './InfluencerTable';
import YoutubeAccount from './YoutubeAccount';
import YoutubeDashboard from './YoutubeDashboard';
import CreatedComments from './CreatedComments';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(localStorage.getItem('lastSelectedKey') || 'home');
  
  // 댓글 페이지에서 보여줄 선택된 비디오 Key 관리
  const [selectedVideoKey, setSelectedVideoKey] = useState(null);

  const API_BASE_URL = 'http://34.64.158.35:8000';

  // videos 상태 관리 (초기값 빈 배열)
  const [videos, setVideos] = useState([]);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 영상 불러오기 함수
  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/videos`);
      console.log("백엔드 원본 데이터:", response.data); // ✅ 이 로그 확인!

      // DB 데이터 형식을 프론트엔드 형식으로 변환
      // DB: id, generated_comments  <-> Front: key, comments
      const formattedData = response.data.map(v => ({
        key: v.id,                 // Antd 테이블용 key
        title: v.title,
        url: v.url,
        status: v.status,
        ...v
      }));
      console.log("변환된 데이터:", formattedData);
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

  // 대시보드에서 '댓글 보러가기' 클릭 시 실행되는 함수
  const handleGoToComments = (record) => {
    setSelectedVideoKey(record.key); // 해당 비디오를 선택 상태로 설정
    setSelectedKey('yt_comment_list'); // 메뉴를 '생성된 댓글' 페이지로 강제 전환
  };

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
    // 메뉴를 직접 누르면 비디오 선택을 초기화하거나 유지할지 결정 (여기선 유지)
  };

  const items = [
    // ... (메뉴 아이템 정의는 기존과 동일하므로 생략) ...
    { key: 'home', icon: <HomeOutlined />, label: '홈' },
    {
      key: 'influencer_marketing', icon: <UserOutlined />, label: '인플루언서 마케팅',
      children: [
        { key: 'paid_seeding', label: '유상 시딩', children: [{ key: 'paid_selection', label: '인플루언서 선별' }] },
        { key: 'unpaid_seeding', label: '무상 시딩', children: [{ key: 'unpaid_selection', label: '인플루언서 선별' }] }
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
    // ... 나머지 메뉴
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'home':
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Title level={3}>홈 대시보드</Title></div>;
      
      case 'paid_selection':
        return <InfluencerTable />;
      case 'unpaid_selection':
        return <InfluencerTable />;
        
      case 'youtube_account':
        return <YoutubeAccount />;

      case 'yt_comment_list':
        // CreatedComments에 데이터와 선택된 키, 변경 함수 전달
        return (
          <CreatedComments 
            data={videos} 
            selectedVideoKey={selectedVideoKey} 
            onSelectVideo={setSelectedVideoKey} 
          />
        );

      case 'youtube_dashboard':
        // [수정] YoutubeDashboard에 데이터와 이동 함수 전달
        return (
          <YoutubeDashboard 
            data={videos} 
            onGoToComments={handleGoToComments} 
          />
        );

      case 'youtube_comment_prompt':
        return <div>프롬프트 준비 중</div>;
      
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
          selectedKeys={[selectedKey]} // ✅ defaultSelectedKeys 대신 selectedKey 사용 (상태 반영)
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