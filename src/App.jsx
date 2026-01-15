import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
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

// ✅ 데이터 (App.js로 이동하여 공유)
const sharedData = [
  {
    key: '1',
    title: '테스트 영상 1',
    url: 'https://youtu.be/zjy-1NkH7zI',
    status: '댓글 생성 요청',
    comments: ['댓글1', '댓글2'], // 댓글 데이터 예시 추가
  },
  {
    key: '2',
    title: '신제품 리뷰 영상',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    status: '업로드 완료',
    comments: ['좋아요', '굿'],
  },
  {
    key: '3',
    title: '브이로그 3편',
    url: 'https://youtu.be/abcdefghijk',
    status: '대기 중',
    comments: [],
  },
];

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(localStorage.getItem('lastSelectedKey') || 'home');
  
  // 댓글 페이지에서 보여줄 선택된 비디오 Key 관리
  const [selectedVideoKey, setSelectedVideoKey] = useState(null);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
      case 'unpaid_selection':
        return <InfluencerTable />;
        
      case 'youtube_account':
        return <YoutubeAccount />;

      case 'yt_comment_list':
        // CreatedComments에 데이터와 선택된 키, 변경 함수 전달
        return (
          <CreatedComments 
            data={sharedData} 
            selectedVideoKey={selectedVideoKey} 
            onSelectVideo={setSelectedVideoKey} 
          />
        );

      case 'youtube_dashboard':
        // ✅ [수정] YoutubeDashboard에 데이터와 이동 함수 전달
        return (
          <YoutubeDashboard 
            data={sharedData} 
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