import React, { useMemo, useState, useEffect } from 'react'; 
import { Menu, Avatar, Typography, Empty, Card, message, Spin } from 'antd';
import { UserOutlined, YoutubeOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

// API 주소 정의
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 헬퍼 함수 (DB에 썸네일이 없을 경우를 대비한 백업용)
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
    const [comments, setComments] = useState([]); 
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

    const fetchUploadedComments = async () => {
        setLoading(true);
        try {
            // ✅ 쿼리 파라미터 추가 (?only_used=true)
            const res = await axios.get(`${API_BASE_URL}/youtube/videos/${activeVideo.key}/comments`, {
                params: { only_used: true } 
            });
            
            setComments(res.data); 
        } catch (err) {
            console.error(err);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    fetchUploadedComments();
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
                            {/* ✅ 수정됨: DB의 thumbnail_url을 우선 사용하고, 없으면 기존 로직 사용 */}
                            <img 
                                src={activeVideo.thumbnail_url || getYoutubeThumbnail(activeVideo.url)} 
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
                                                        업로드된 댓글 #{index + 1}
                                                    </Text>
                                                    {/* 백엔드 데이터 구조에 따라 comment가 객체일 수도 있고 문자열일 수도 있음 */}
                                                    <Text copyable style={{ color: '#555' }}>
                                                        {typeof comment === 'object' ? comment.content : comment}
                                                    </Text>
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