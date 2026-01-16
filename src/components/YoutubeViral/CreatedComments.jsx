import React, { useMemo, useState, useEffect } from 'react'; 
import { Menu, Avatar, Typography, Empty, Card, message, Spin } from 'antd';
import { UserOutlined, YoutubeOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

// API 주소 정의
const API_BASE_URL = 'http://34.64.158.35:8000';

// 헬퍼 함수
const getYoutubeThumbnail = (url) => {
  if (!url) return 'https://via.placeholder.com/320x180?text=No+URL';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
  }
  return 'https://via.placeholder.com/320x180?text=Invalid+URL';
};

const CreatedComments = ({ data = [], selectedVideoKey, onSelectVideo }) => {
    // 댓글 목록 상태 관리
    const [comments, setComments] = useState([]); // 👈 여기서 useState를 쓰기 때문에 위에서 import 필수
    const [loading, setLoading] = useState(false);

    // 1. 현재 선택된 비디오 찾기
    const activeVideo = useMemo(() => {
        if (!data || data.length === 0) return null;
        if (selectedVideoKey) {
            const found = data.find((v) => String(v.key) === String(selectedVideoKey));
            if (found) return found;
        }
        return data[0];
    }, [data, selectedVideoKey]);

    // 2. activeVideo가 바뀔 때마다 백엔드에서 댓글 가져오기
    useEffect(() => {
        if (!activeVideo) return;

        const fetchComments = async () => {
            setLoading(true);
            console.log(`📡 [API 요청 시작] Video ID: ${activeVideo.key}, Title: ${activeVideo.title}`);
            console.log(`🔗 요청 URL: ${API_BASE_URL}/videos/${activeVideo.key}/comments`);
            try {
                const res = await axios.get(`${API_BASE_URL}/youtube/videos/${activeVideo.key}/comments`);
                console.log(`✅ [API 응답 성공] Video ID: ${activeVideo.key}`);
                console.log("📦 받아온 댓글 데이터:", res.data);

                setComments(res.data); 
            } catch (err) {
                console.error(`❌ [API 에러] Video ID: ${activeVideo.key}`);
                console.error("Error Details:", err)
                
                message.error("댓글을 불러오지 못했습니다.");
                setComments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [activeVideo]);

    const menuItems = data.map((item) => ({
        key: String(item.key),
        label: item.title, 
        icon: <YoutubeOutlined />, 
    }));

    // 데이터가 없을 때
    if (!data || data.length === 0) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <Empty description="영상 데이터가 없습니다." />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100%', background: '#fff', padding: '20px' }}>
            
            {/* 왼쪽: 영상 목록 */}
            <div style={{ width: '250px', borderRight: '1px solid #f0f0f0', paddingRight: '20px' }}>
                <Title level={4} style={{ marginBottom: 20 }}>영상 목록</Title>
                <Menu
                    mode="inline"
                    selectedKeys={[activeVideo ? String(activeVideo.key) : '']}
                    onClick={({ key }) => onSelectVideo(key)}
                    style={{ borderRight: 0 }}
                    items={menuItems}
                />
            </div>

            {/* 오른쪽: 상세 내용 */}
            <div style={{ flex: 1, paddingLeft: '40px', overflowY: 'auto' }}>
                {activeVideo ? (
                    <div>
                        <Title level={3}>{activeVideo.title}</Title>
                        
                        <div style={{ marginBottom: '30px' }}>
                            <img 
                                src={getYoutubeThumbnail(activeVideo.url)} 
                                alt="Thumbnail" 
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '480px', 
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                                }} 
                            />
                        </div>

                        <Title level={5}>
                            생성된 댓글 ({comments ? comments.length : 0})
                        </Title>
                        
                        {/* 로딩 처리 및 목록 렌더링 */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="large" /></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {comments && comments.length > 0 ? (
                                    comments.map((comment, index) => (
                                        <Card key={index} size="small" style={{ borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068', flexShrink: 0 }} />
                                                <div style={{ flex: 1 }}>
                                                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                                                        추천 댓글 #{index + 1}
                                                    </Text>
                                                    <Text copyable style={{ color: '#555' }}>{comment}</Text>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="아직 생성된 댓글이 없습니다." />
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Empty description="영상을 선택해주세요." />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatedComments;