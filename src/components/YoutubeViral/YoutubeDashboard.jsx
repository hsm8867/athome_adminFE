import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Table, Card, message, Space, Typography, Modal, Select, Form, Spin, Popconfirm } from 'antd';
import { YoutubeOutlined, RobotOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const YoutubeDashboard = ({ data = [] }) => { 
  // API 주소 설정
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://34.64.158.35:8000';

  // --- 상태 관리 ---
  const [urlInput, setUrlInput] = useState(() => sessionStorage.getItem('y_url_input') || '');
  const [commentCount, setCommentCount] = useState(5); 
  const [currentVideoId, setCurrentVideoId] = useState(() => sessionStorage.getItem('y_vid') ? parseInt(sessionStorage.getItem('y_vid')) : null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [comments, setComments] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // 수정 모드 상태
  const [editingKey, setEditingKey] = useState(''); 
  const [editingContent, setEditingContent] = useState(''); 

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [personas, setPersonas] = useState([]); 
  const [form] = Form.useForm();

  const pollingRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    sessionStorage.setItem('y_url_input', urlInput);
  }, [urlInput]);

  useEffect(() => {
    fetchPersonas();
    fetchComments(null, true); 
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (currentVideoId) {
      sessionStorage.setItem('y_vid', currentVideoId);
    }
  }, [currentVideoId]);

  // --- API 호출 함수들 ---
  const fetchPersonas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/persona`);
      setPersonas(response.data);
    } catch (error) {
      console.error('페르소나 목록 로딩 실패:', error);
    }
  };

  const fetchComments = async (videoId = null, isSilent = false) => {
    if (!isSilent) setListLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/videos/comments`);
      const rawData = response.data;
      
      const formattedData = rawData.map((item, index) => ({
        key: item.id || index,
        ...item,
        status: item.status || '대기 중',
      }));

      if (formattedData.length !== comments.length) {
           setComments(formattedData);
           if (!isSilent) message.success('목록이 업데이트되었습니다.');
           return true; 
      }
      setComments(formattedData); 
      return false; 
    } catch (error) {
      console.error(error);
      if (!isSilent) message.error('목록 로딩 실패');
      return false;
    } finally {
      if (!isSilent) setListLoading(false);
    }
  };

  // --- 핸들러 ---
  const handleOpenModal = () => {
    if (!urlInput) {
      message.warning('YouTube URL을 입력해주세요.');
      return;
    }
    form.resetFields();
    form.setFieldsValue({ title: '' }); 
    setIsModalVisible(true);
  };

  const handleGenerateConfirm = async () => {
    try {
      const values = await form.validateFields();
      setIsModalVisible(false); 
      setIsGenerating(true); 

      const response = await axios.post(`${API_BASE_URL}/youtube/videos`, {
        url: urlInput,
        title: values.title,        
        persona_id: values.persona,
        count: commentCount || 5
      });

      const videoId = response.data.video_id;
      setCurrentVideoId(videoId);
      setIsGenerating(false);
      message.success('댓글 생성이 시작되었습니다. (약 1~2분 소요)', 3);
      startPolling(); 

    } catch (error) {
      if (error.errorFields) return;
      console.error(error);
      message.error('요청 실패');
      setIsGenerating(false);
    }
  };

  const startPolling = () => {
    stopPolling();
    let attempts = 0;
    const maxAttempts = 30; 
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      const hasUpdates = await fetchComments(null, true); 
      if (hasUpdates) {
        stopPolling();
        message.success('댓글 생성이 완료되었습니다!', 4);
      } else if (attempts >= maxAttempts) {
        stopPolling();
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/youtube/comments/${id}`);
      message.success('삭제되었습니다.');
      setComments(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(error);
      message.error('삭제 실패');
    }
  };

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    setEditingKey(record.key);
    setEditingContent(record.content); 
  };

  const cancel = () => {
    setEditingKey('');
    setEditingContent('');
  };

  const save = async (key) => {
    try {
      await axios.put(`${API_BASE_URL}/youtube/comments/${key}`, {
        content: editingContent
      });

      const newData = [...comments];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, content: editingContent });
        setComments(newData);
        setEditingKey('');
        message.success('수정되었습니다.');
      }
    } catch (error) {
      console.error('Update failed:', error);
      message.error('수정 실패');
    }
  };

  const handleRegisterComments = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('등록할 댓글을 선택해주세요.');
      return;
    }

    setUploadLoading(true);

    try {
      const now = dayjs();
      let updatedComments = [...comments];
      const selectedItems = comments.filter(item => selectedRowKeys.includes(item.key));
      const totalSelected = selectedItems.length;
      
      const getRandomMinute = (max) => Math.floor(Math.random() * max);

      selectedItems.forEach((item, index) => {
        let scheduleTime;
        if (totalSelected <= 3) {
          scheduleTime = now.add(getRandomMinute(30), 'minute');
        } else {
          if (index < 3) {
            scheduleTime = now.add(getRandomMinute(30), 'minute');
          } else {
            const delay = 30 + (index - 3) * 30;
            scheduleTime = now.add(delay, 'minute');
          }
        }

        const targetIndex = updatedComments.findIndex(c => c.key === item.key);
        if (targetIndex > -1) {
            updatedComments[targetIndex] = {
                ...updatedComments[targetIndex],
                status: '댓글 업로드 대기중',
                scheduled_time: scheduleTime.format('YYYY-MM-DD HH:mm:ss')
            };
        }
      });

      setComments(updatedComments);

      const payload = selectedItems.map(item => {
          const updatedItem = updatedComments.find(c => c.key === item.key);
          return {
              comment_id: item.id,
              content: item.content,
              scheduled_time: updatedItem.scheduled_time
          };
      });

      const targetVideoId = selectedItems[0].video_id;

      if (!targetVideoId) {
        message.error("영상 ID를 찾을 수 없습니다.");
        return;
      }

      await axios.post(`${API_BASE_URL}/youtube/${targetVideoId}/upload_comment`, {
          comments: payload
      });

      message.success('댓글 등록 예약이 완료되었습니다.');
      setSelectedRowKeys([]);
      
    } catch (error) {
      console.error(error);
      message.error('등록 실패');
    } finally {
      setUploadLoading(false);
    }
  };

  // --- 테이블 컬럼 정의 ---
  const columns = [
    {
      title: '영상제목',
      dataIndex: 'video_id', 
      key: 'video_title',
      width: 160, // ✅ 너비 명시
      fixed: 'left',
      render: (videoId) => {
        const targetVideo = data.find(v => v.id === videoId);
        return (
          <div style={{ width: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Text strong>{targetVideo ? targetVideo.title : '-'}</Text>
          </div>
        );
      }
    },
    {
      title: 'URL',
      dataIndex: 'video_id',
      key: 'video_url',
      width: 80, // ✅ 너비 명시
      align: 'center',
      render: (videoId) => {
        const targetVideo = data.find(v => v.id === videoId);
        if (!targetVideo) return '-';
        return (
          <a href={targetVideo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
            이동
          </a>
        );
      }
    },
    {
      title: '썸네일',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      width: 120, // ✅ 너비 명시
      align: 'center',
      render: (url) => (
        url ? (
          <img 
            src={url} 
            alt="thumbnail" 
            style={{ 
              width: '90px', 
              height: '50px', 
              objectFit: 'cover', 
              borderRadius: '4px',
              border: '1px solid #f0f0f0'
            }} 
          />
        ) : <span style={{fontSize: '10px', color:'#ccc'}}>No Image</span>
      )
    },
    {
      title: '생성된 댓글',
      dataIndex: 'content',
      key: 'content',
      width: 450, // ✅ 너비 명시 (가장 넓게)
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <TextArea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ color: '#d63384' }}
          />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', color: '#d63384', wordBreak: 'keep-all', minWidth: '200px' }}>{text}</div>
        );
      },
    },
    {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        align: 'center',
        render: (status) => {
            let color = '#888'; // 기본 색상 (대기 중 등)
            let fontWeight = 'normal';

            if (status === '업로드 완료') {
                color = '#1890ff'; // ✅ 파란색 (성공)
                fontWeight = 'bold';
            } else if (['업로드 실패', '에러 발생', '토큰 만료'].includes(status)) {
                color = '#ff4d4f'; // ✅ 빨간색 (실패 계열)
                fontWeight = 'bold';
            } else if (status === '예약됨') {
                color = '#c7ad1c'; // ✅ 노란색
                fontWeight = 'bold';
            } 

            return (
                <span style={{ color: color, fontWeight: fontWeight, fontSize: '12px' }}>
                    {status}
                </span>
            );
        }
    },
    {
        title: '반영 시점',
        dataIndex: 'scheduled_time',
        key: 'scheduled_time',
        width: 140, // ✅ 너비 명시
        align: 'center',
        render: (time) => (
            <span style={{ color: time ? '#1890ff' : '#ccc', fontSize: '12px' }}>
                {time ? dayjs(time).format('MM-DD HH:mm') : '-'}
            </span>
        )
    },
    {
      title: '작업',
      key: 'action',
      align: 'center',
      width: 140, // ✅ 너비 명시
      fixed: 'right', // 우측 고정
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="small">
            <Button 
                type="primary" 
                size="small" 
                icon={<SaveOutlined />} 
                onClick={() => save(record.key)}
            >
                저장
            </Button>
            <Button 
                size="small" 
                icon={<CloseOutlined />} 
                onClick={cancel}
            >
                취소
            </Button>
          </Space>
        ) : (
          <Space size="small">
            <Button 
                size="small" 
                icon={<EditOutlined />} 
                onClick={() => edit(record)} 
            >
              수정
            </Button>
            <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)}>
                <Button size="small" danger icon={<DeleteOutlined />}>
                  삭제
                </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <Spin spinning={isGenerating} tip="요청 전송 중..." size="large">
        
        <Card bordered={false} style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            <YoutubeOutlined style={{ color: 'red', marginRight: 8 }} />
            영상 등록 및 댓글 생성
          </Title>
          <Space.Compact style={{ width: '100%' }} size="large">
            <Input 
              placeholder="YouTube 영상 URL을 입력하세요" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onPressEnter={handleOpenModal}
            />
            <Button 
              type="primary" 
              icon={<RobotOutlined />} 
              onClick={handleOpenModal}
              style={{ backgroundColor: '#ff0000', borderColor: '#ff0000' }}
            >
              등록 & 생성
            </Button>
          </Space.Compact>
        </Card>

        <Card bordered={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
               전체 생성 댓글 리스트
            </Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchComments(null, false)} 
              loading={listLoading}
            >
              새로고침
            </Button>
          </div>

          <Table 
            rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys)
            }}
            columns={columns} 
            dataSource={comments} 
            pagination={{ pageSize: 10 }} 
            loading={listLoading}
            locale={{ emptyText: '생성된 댓글이 없습니다.' }}
            // ✅ 핵심 변경: 1200px 대신 'max-content' 사용 
            // -> 화면이 좁으면 스크롤 생성, 넓으면 꽉 채움
            scroll={{ x: 'max-content' }} 
          />
          
          <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                size="large"
                icon={<UploadOutlined />}
                onClick={handleRegisterComments}
                loading={uploadLoading}
                style={{ backgroundColor: '#1f1f1f', borderColor: '#1f1f1f', minWidth: '150px' }}
              >
                  선택 댓글 등록
              </Button>
          </div>

        </Card>
      </Spin>

      {/* 모달 등 나머지 유지 */}
      <Modal
        title="영상 정보 및 페르소나 설정"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleGenerateConfirm}
        okText="댓글 생성 시작"
        cancelText="취소"
        confirmLoading={isGenerating}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="영상 제목"
            name="title"
            rules={[{ required: true, message: '제목 입력' }]}
          >
            <Input prefix={<EditOutlined />} />
          </Form.Item>

          <Form.Item
            label="AI 페르소나"
            name="persona"
            rules={[{ required: true, message: '페르소나 선택' }]}
          >
            <Select>
              {personas.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default YoutubeDashboard;