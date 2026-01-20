import React, { useMemo, useState, useEffect } from 'react'; 
import { Menu, Avatar, Typography, Empty, Card, message, Spin, Button, Tag, Popconfirm } from 'antd';
import { UserOutlined, YoutubeOutlined, ClockCircleOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs'; // 날짜 비교를 위해 dayjs 사용 권장 (없으면 new Date() 사용)

const { Title, Text } = Typography;

// API 주소 정의
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    // 전체 댓글 목록 상태
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

    // 2. 댓글 목록 불러오기 함수
    const fetchComments = async () => {
        if (!activeVideo) return;
        setLoading(true);
        try {
            // ✅ 수정됨: only_used=true 제거 (예약된 것도 가져와야 함)
            const res = await axios.get(`${API_BASE_URL}/youtube/videos/${activeVideo.key}/comments`);
            setComments(res.data); 
        } catch (err) {
            console.error(err);
            message.error("댓글 목록을 불러오지 못했습니다.");
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [activeVideo]);

    // 3. 댓글 분류 (업로드 완료 vs 예정)
    const { uploadedComments, scheduledComments } = useMemo(() => {
        const uploaded = [];
        const scheduled = [];
        const now = new Date();

        comments.forEach(c => {
            // 날짜 파싱 (DB 포맷에 따라 수정 필요할 수 있음)
            const scheduledTime = c.scheduled_time ? new Date(c.scheduled_time) : null;
            
            // 조건 1: 상태가 '업로드 완료' 이거나
            // 조건 2: 이미 사용됨(is_used) 표시가 있고 시간이 지난 경우
            if (c.status === '업로드 완료' || (c.is_used && scheduledTime && scheduledTime <= now)) {
                uploaded.push(c);
            } 
            // 조건: 상태가 '예약됨' 이거나 시간이 미래인 경우
            else if (c.status === '예약됨' || (scheduledTime && scheduledTime > now)) {
                scheduled.push(c);
            }
            // 그 외(대기 중, 에러 등)는 여기서 표시 안 함 (필요시 추가)
        });

        return { uploadedComments: uploaded, scheduledComments: scheduled };
    }, [comments]);


    // 4. 예약 취소 핸들러
    const handleCancelSchedule = async (commentId) => {
        try {
            // ✅ 수정됨: 별도 라우터 대신 PUT /comments/{id} 사용
            await axios.put(`${API_BASE_URL}/youtube/comments/${commentId}`, {
                status: '대기 중',       // 상태 원복
                scheduled_time: null     // 예약 시간 초기화 (null 전송)
            });
            
            message.success("예약이 취소되었습니다.");
            fetchComments(); // 목록 갱신
        } catch (error) {
            console.error(error);
            message.error("취소에 실패했습니다.");
        }
    };

    const menuItems = data.map((item) => ({
        key: String(item.key),
        label: item.title, 
        icon: <YoutubeOutlined />, 
    }));

    // 데이터가 없을 때 UI
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
                            <a 
                                href={activeVideo.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'inline-block', maxWidth: '480px', width: '100%' }}
                            >
                                <img 
                                    src={activeVideo.thumbnail_url || getYoutubeThumbnail(activeVideo.url)} 
                                    alt="Thumbnail" 
                                    style={{ 
                                        width: '100%', 
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        transition: 'opacity 0.2s'
                                    }} 
                                    onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
                                    onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                                />
                            </a>
                        </div>

                        {/* 로딩 처리 및 목록 렌더링 */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="large" /></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                {/* ✅ 섹션 1: 업로드 완료된 댓글 */}
                                {uploadedComments.length > 0 && (
                                    <div>
                                        <Title level={5} style={{ color: '#52c41a' }}>
                                            <CheckCircleOutlined /> 업로드 완료 ({uploadedComments.length})
                                        </Title>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {uploadedComments.map((comment, index) => (
                                                <Card key={comment.id} size="small" style={{ borderRadius: '8px', borderLeft: '4px solid #52c41a' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a', flexShrink: 0 }} />
                                                        <div style={{ flex: 1 }}>
                                                            <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                                                                업로드된 댓글 #{index + 1}
                                                                <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px', fontWeight: 'normal' }}>
                                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                                </span>
                                                            </Text>
                                                            <Text copyable style={{ color: '#555' }}>
                                                                {comment.content}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ 섹션 2: 업로드 예정 댓글 */}
                                {scheduledComments.length > 0 && (
                                    <div>
                                        <Title level={5} style={{ color: '#fa8c16' }}>
                                            <ClockCircleOutlined /> 업로드 예정 ({scheduledComments.length})
                                        </Title>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {scheduledComments.map((comment, index) => (
                                                <Card key={comment.id} size="small" style={{ borderRadius: '8px', borderLeft: '4px solid #fa8c16', background: '#fff7e6' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                        {/* 프로필 색깔 다르게 (주황색) */}
                                                        <Avatar icon={<ClockCircleOutlined />} style={{ backgroundColor: '#fa8c16', flexShrink: 0 }} />
                                                        
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                <Text strong>
                                                                    업로드 예정 댓글 #{index + 1}
                                                                </Text>
                                                                {/* 예정 시간 표시 */}
                                                                <Tag color="orange">
                                                                    {comment.scheduled_time 
                                                                        ? new Date(comment.scheduled_time).toLocaleString() 
                                                                        : '시간 미정'}
                                                                </Tag>
                                                            </div>
                                                            
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <Text style={{ color: '#555' }}>
                                                                    {comment.content}
                                                                </Text>
                                                            </div>

                                                            {/* ✅ 예약 취소 버튼 */}
                                                            <div style={{ textAlign: 'right' }}>
                                                                <Popconfirm
                                                                    title="예약 취소"
                                                                    description="정말 이 댓글의 업로드를 취소하시겠습니까?"
                                                                    onConfirm={() => handleCancelSchedule(comment.id)}
                                                                    okText="예"
                                                                    cancelText="아니오"
                                                                >
                                                                    <Button 
                                                                        size="small" 
                                                                        danger 
                                                                        icon={<CloseOutlined />}
                                                                        type="dashed"
                                                                    >
                                                                        업로드 취소
                                                                    </Button>
                                                                </Popconfirm>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 둘 다 없을 때 */}
                                {uploadedComments.length === 0 && scheduledComments.length === 0 && (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="표시할 댓글 내역이 없습니다." />
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