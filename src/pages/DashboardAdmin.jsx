// src/pages/DashboardAdmin.jsx
import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../utils/axiosInstance';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
} from 'chart.js';
import MainContent from '../components/common/MainContent';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../config/api';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // 차트 라벨을 상수로 분리
  const CHART_LABELS = ['요구사항 정의', '화면 설계', '디자인', '퍼블리싱', '개발', '검수', '완료', '기타'];

  // 단계 이름 정규화 함수와 유효한 단계 목록을 컴포넌트 최상단으로 이동
  const normalizeProgress = (name) => {
    if (name === '요구사항정의' || name === '요구사항 정의') return '요구사항 정의';
    if (name === '화면설계' || name === '화면 설계') return '화면 설계';
    return name;
  };

  const validStages = ['요구사항 정의', '화면 설계', '디자인', '퍼블리싱', '개발', '검수', '완료', 'COMPLETED'];

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user || user.companyRole !== 'ADMIN') {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const [activeMenuItem, setActiveMenuItem] = useState('대시보드');
  const [recentPosts, setRecentPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    projectChange: 0,
    activeProjects: 0,
    activeChange: 0,
    completedProjects: 0,
    completedChange: 0,
    pendingInquiries: 0,
    inquiryChange: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [summaryData, setSummaryData] = useState([
    { title: '계약중인 프로젝트', value: 0 },
    { title: '검수중인 프로젝트', value: 0 },
    { title: '완료된 프로젝트', value: 0 }
  ]);
  const [adminInquiries, setAdminInquiries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState({
    labels: ['1주차', '2주차', '3주차', '4주차', '5주차'],
    datasets: [
      {
        label: '프로젝트 금액',
        data: [15000000, 25000000, 18000000, 30000000, 22000000],
        borderColor: '#2E7D32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2E7D32',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ],
  });
  const [recentProposals, setRecentProposals] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  const [projectStatusData, setProjectStatusData] = useState({
    labels: CHART_LABELS,
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: [
        '#e8f5e9',  // 요구사항 정의 - 가장 밝은 녹색
        '#c8e6c9',  // 화면 설계
        '#a5d6a7',  // 디자인
        '#81c784',  // 퍼블리싱
        '#66bb6a',  // 개발
        '#4caf50',  // 검수
        '#2E7D32',  // 완료 - 시그니처 색상
        '#e2e8f0'   // 기타 - 회색
      ],
      borderWidth: 0,
    }]
  });

  const monthlyStatsData = {
    labels: monthlyStats.map(stat => stat.month),
    datasets: [
      {
        label: '전체 프로젝트',
        data: monthlyStats.map(stat => stat.totalProjects),
        backgroundColor: '#2E7D32',
      },
      {
        label: '완료된 프로젝트',
        data: monthlyStats.map(stat => stat.completedProjects),
        backgroundColor: '#66BB6A',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 10,
          padding: 10,
          font: {
            size: 11
          },
          generateLabels: function(chart) {
            const datasets = chart.data.datasets;
            const labels = chart.data.labels;
            const data = datasets[0].data;
            
            return labels.map((label, i) => ({
              text: `${label} (${data[i]}개)`,
              fillStyle: datasets[0].backgroundColor[i],
              hidden: false,
              lineCap: 'butt',
              lineDash: [],
              lineDashOffset: 0,
              lineJoin: 'miter',
              lineWidth: 1,
              strokeStyle: '#fff',
              pointStyle: 'circle',
              rotation: 0
            }));
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value}개 (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
    onClick: (event, elements) => {
      handleChartClick(elements);
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    }
  };

  const formatCurrency = (value) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만원`;
    } else {
      return `${value.toLocaleString()}원`;
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        const month = monthlyStatsData.labels[index];
        const type = datasetIndex === 0 ? '전체' : '완료된';
        
        setModalTitle(`${month} ${type} 프로젝트`);
        setModalType('monthly');
        setShowModal(true);
        setLoading(true);

        try {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          const targetMonth = index === 0 ? currentMonth - 1 : currentMonth;

          const filteredProjects = allProjects.filter(project => {
            if (datasetIndex === 0) {
              // 전체 프로젝트 - startDate 기준
              const startDate = new Date(project.startDate);
              return startDate.getFullYear() === currentYear && startDate.getMonth() === targetMonth;
            } else {
              // 완료된 프로젝트 - projectFeePaidDate 기준
              if (project.projectFeePaidDate) {
                const paidDate = new Date(project.projectFeePaidDate);
                return paidDate.getFullYear() === currentYear && paidDate.getMonth() === targetMonth;
              }
              return false;
            }
          });

          setProjectList(filteredProjects);
        } catch (error) {
          console.error('Error filtering projects:', error);
          setProjectList([]);
        } finally {
          setLoading(false);
        }
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    }
  };

  const [modalType, setModalType] = useState('');

  const handleBarClick = (data) => {
    if (data && data.activePayload) {
      const weekData = revenueData.find(item => item.name === data.activePayload[0].payload.name);
      setModalTitle(`${weekData.name} 정산 프로젝트`);
      setModalType('revenue');
      setShowModal(true);
      setLoading(true);

      try {
        // 해당 주차의 프로젝트 목록을 모달에 표시
        const weekProjects = allProjects.filter(project => {
          if (project.projectFeePaidDate) {
            const paidDate = new Date(project.projectFeePaidDate);
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            if (paidDate >= firstDay && paidDate <= lastDay) {
              const weekNumber = Math.floor((paidDate.getDate() - 1) / 7);
              return weekNumber === parseInt(weekData.name[0]) - 1;
            }
          }
          return false;
        });

        setProjectList(weekProjects);
      } catch (error) {
        console.error('Error filtering projects:', error);
        setProjectList([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const weekNumber = index + 1;
        setModalTitle(`${weekNumber}주차 정산 프로젝트`);
        setModalType('revenue');
        setShowModal(true);
        setLoading(true);

        try {
          const weekProjects = allProjects.filter(project => {
            if (project.projectFeePaidDate) {
              const paidDate = new Date(project.projectFeePaidDate);
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
              const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

              if (paidDate >= firstDay && paidDate <= lastDay) {
                const projectWeekNumber = Math.floor((paidDate.getDate() - 1) / 7);
                return projectWeekNumber === index;
              }
            }
            return false;
          });

          setProjectList(weekProjects);
        } catch (error) {
          console.error('Error filtering projects:', error);
          setProjectList([]);
        } finally {
          setLoading(false);
        }
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'ON_HOLD':
        return '보류';
      default:
        return '대기중';
    }
  };

  const getInquiryStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return '대기중';
      case 'IN_PROGRESS':
        return '처리중';
      case 'COMPLETED':
        return '완료';
      default:
        return '대기중';
    }
  };

  const handleMenuClick = (menuItem) => {
    setActiveMenuItem(menuItem);
  };

  useEffect(() => {
    const fetchProjectStatusData = async () => {
      try {
        console.log('▶ 프로젝트 상태 데이터 조회 시도');
        const { data } = await axiosInstance.get('/projects/dashboard/inspection_count', {
          withCredentials: true
        });
        console.log('▶ 프로젝트 상태 데이터 조회 성공:', data);
        
        // 도넛 차트 데이터 업데이트
        setProjectStatusData(prevData => ({
          ...prevData,
          datasets: [{
            ...prevData.datasets[0],
            data: [
              data.requirements || 0,
              data.wireframe || 0,
              data.design || 0,
              data.publishing || 0,
              data.development || 0,
              data.inspection || 0,
              data.completed || 0,
              data.other || 0
            ]
          }]
        }));
      } catch (error) {
        console.error('▶ 프로젝트 상태 데이터 조회 실패:', error);
        if (error.response?.status === 401) {
          console.log('▶ 인증이 필요합니다.');
          navigate('/login');
        } else if (error.response?.status === 403) {
          console.log('▶ 권한이 없습니다.');
          alert('프로젝트 상태 데이터를 조회할 권한이 없습니다.');
        } else {
          console.log('▶ 기타 오류 발생');
          alert('프로젝트 상태 데이터를 불러오는데 실패했습니다.');
        }
      }
    };

    const fetchRevenueData = async () => {
      try {
        const { data } = await axiosInstance.get('/projects/dashboard/project_fee');
        console.log('Revenue data:', data);
        
        // 수익 데이터 업데이트
        const revenueData = {
          labels: ['1주차', '2주차', '3주차', '4주차', '5주차'],
          datasets: [
            {
              label: '프로젝트 금액',
              data: [
                data.week1 || 0,
                data.week2 || 0,
                data.week3 || 0,
                data.week4 || 0,
                data.week5 || 0
              ],
              borderColor: '#2E7D32',
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#2E7D32',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ],
        };
        setRevenueData(revenueData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      }
    };

    fetchProjectStatusData();
    fetchRevenueData();
  }, []);

  useEffect(() => {
    console.log('useEffect for recent posts triggered');
    fetchRecentPosts();
  }, []);

  const fetchRecentPosts = async () => {
    try {
      console.log('Fetching recent posts...');
      const { data } = await axiosInstance.get(API_ENDPOINTS.POST.ADMIN_RECENT, {
        withCredentials: true
      });
      console.log('Recent posts data:', data);
      setRecentPosts(data);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      setRecentPosts([]);
    }
  };

  useEffect(() => {
    const fetchAdminInquiries = async () => {
      try {
        const { data } = await axiosInstance.get('/admininquiry', {
          withCredentials: true
        });
        console.log('Admin inquiries data:', data);
        setAdminInquiries(data);
      } catch (error) {
        console.error('Error fetching admin inquiries:', error);
        setAdminInquiries([]);
      }
    };

    fetchAdminInquiries();
  }, []);

  useEffect(() => {
    const fetchRecentProposals = async () => {
      try {
        const { data } = await axiosInstance.get('/approval/admin/recent', {
          withCredentials: true
        });
        console.log('Recent proposals data:', data);
        setRecentProposals(data.approvalList || []);
      } catch (error) {
        console.error('Error fetching recent proposals:', error);
        setRecentProposals([]);
      }
    };

    fetchRecentProposals();
  }, []);

  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.ADMIN_PROJECTS, {
          withCredentials: true
        });
        
        // 삭제되지 않은 프로젝트만 필터링
        const activeProjects = data.filter(project => !project.deleted);
        setAllProjects(activeProjects);
        
        // 통계 데이터 계산
        const totalProjects = activeProjects.filter(project => !project.deleted).length;
        const inProgressProjects = activeProjects.filter(project => {
          const normalizedProgress = normalizeProgress(project.currentProgress);
          return !project.deleted && normalizedProgress !== 'COMPLETED' && normalizedProgress !== '완료';
        }).length;
        const completedProjects = activeProjects.filter(project => {
          const normalizedProgress = normalizeProgress(project.currentProgress);
          return !project.deleted && (normalizedProgress === 'COMPLETED' || normalizedProgress === '완료');
        }).length;

        // 프로젝트 단계별 통계 계산
        const progressCounts = {
          REQUIREMENTS: activeProjects.filter(p => !p.deleted && normalizeProgress(p.currentProgress) === '요구사항 정의').length,
          WIREFRAME: activeProjects.filter(p => !p.deleted && normalizeProgress(p.currentProgress) === '화면 설계').length,
          DESIGN: activeProjects.filter(p => !p.deleted && normalizeProgress(p.currentProgress) === '디자인').length,
          PUBLISHING: activeProjects.filter(p => !p.deleted && normalizeProgress(p.currentProgress) === '퍼블리싱').length,
          DEVELOPMENT: activeProjects.filter(p => !p.deleted && normalizeProgress(p.currentProgress) === '개발').length,
          INSPECTION: activeProjects.filter(p => !p.deleted && normalizeProgress(p.currentProgress) === '검수').length,

          COMPLETED: activeProjects.filter(p => {
            const normalizedProgress = normalizeProgress(p.currentProgress);
            return !p.deleted && (normalizedProgress === 'COMPLETED' || normalizedProgress === '완료');
          }).length,

          OTHER: activeProjects.filter(p => {
            const normalizedProgress = normalizeProgress(p.currentProgress);
            return !p.deleted && !validStages.includes(normalizedProgress);
          }).length
        };

        // 도넛 차트 데이터 업데이트
        setProjectStatusData(prevData => ({
          ...prevData,
          labels: CHART_LABELS,
          datasets: [{
            ...prevData.datasets[0],
            data: [
              progressCounts.REQUIREMENTS,
              progressCounts.WIREFRAME,
              progressCounts.DESIGN,
              progressCounts.PUBLISHING,
              progressCounts.DEVELOPMENT,
              progressCounts.INSPECTION,
              progressCounts.COMPLETED,
              progressCounts.OTHER
            ]
          }]
        }));

        // 월별 프로젝트 통계 계산
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // 이번 달과 저번 달의 프로젝트 통계
        const monthlyTotalProjects = [0, 0]; // [저번 달, 이번 달]
        const monthlyCompletedProjects = [0, 0]; // [저번 달, 이번 달]

        activeProjects.forEach(project => {
          // 전체 프로젝트 통계 (startDate 기준)
          const startDate = new Date(project.startDate);
          if (startDate.getFullYear() === currentYear) {
            if (startDate.getMonth() === currentMonth) {
              monthlyTotalProjects[1]++; // 이번 달
            } else if (startDate.getMonth() === currentMonth - 1) {
              monthlyTotalProjects[0]++; // 저번 달
            }
          }

          // 완료된 프로젝트 통계 (currentProgress가 COMPLETED인 경우)
          const normalizedProgress = normalizeProgress(project.currentProgress);
          if (normalizedProgress === 'COMPLETED' || normalizedProgress === '완료') {
            const completedDate = new Date(project.projectFeePaidDate || project.endDate);
            if (completedDate.getFullYear() === currentYear) {
              if (completedDate.getMonth() === currentMonth) {
                monthlyCompletedProjects[1]++; // 이번 달
              } else if (completedDate.getMonth() === currentMonth - 1) {
                monthlyCompletedProjects[0]++; // 저번 달
              }
            }
          }
        });

        // 월별 통계 데이터 설정
        const getMonthLabel = (month) => {
          return new Date(currentYear, month, 1).toLocaleString('ko-KR', { month: 'long' });
        };

        const prevMonthLabel = getMonthLabel(currentMonth - 1);
        const currentMonthLabel = getMonthLabel(currentMonth);

        setMonthlyStats([
          {
            month: prevMonthLabel,
            totalProjects: monthlyTotalProjects[0],
            completedProjects: monthlyCompletedProjects[0]
          },
          {
            month: currentMonthLabel,
            totalProjects: monthlyTotalProjects[1],
            completedProjects: monthlyCompletedProjects[1]
          }
        ]);
        
        setStats({
          totalProjects,
          activeProjects: inProgressProjects,
          completedProjects
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchAllProjects();
  }, []);

  const handlePostClick = (postId, projectId) => {
    navigate(`/project/${projectId}/post/${postId}`);
  };

  const handleSummaryClick = async (title) => {
    setModalTitle(title);
    setShowModal(true);
    setLoading(true);

    try {
      let filteredProjects;
      switch (title) {
        case '전체 프로젝트':
          filteredProjects = allProjects.filter(project => !project.deleted);
          break;
        case '진행중인 프로젝트':
          filteredProjects = allProjects.filter(project => {
            const normalizedProgress = normalizeProgress(project.currentProgress);
            return !project.deleted && normalizedProgress !== 'COMPLETED' && normalizedProgress !== '완료';
          });
          break;
        case '완료된 프로젝트':
          filteredProjects = allProjects.filter(project => {
            const normalizedProgress = normalizeProgress(project.currentProgress);
            return !project.deleted && (normalizedProgress === 'COMPLETED' || normalizedProgress === '완료');
          });
          break;
        default:
          filteredProjects = [];
      }
      
      setProjectList(filteredProjects);
    } catch (error) {
      console.error('Error filtering projects:', error);
      setProjectList([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDday = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDdayStyle = (dday) => {
    if (dday < 0) return { color: '#EF4444', backgroundColor: '#FEF2F2' };
    if (dday <= 7) return { color: '#F59E0B', backgroundColor: '#FFFBEB' };
    return { color: '#10B981', backgroundColor: '#ECFDF5' };
  };

  const getProgressText = (progress) => {
    const normalizedProgress = normalizeProgress(progress);
    
    if (normalizedProgress === 'COMPLETED') return '완료';
    if (!validStages.includes(normalizedProgress)) return '기타';
    return normalizedProgress;
  };

  const handleInquiryClick = (inquiryId) => {
    navigate(`/admin/inquiry/${inquiryId}`);
  };

  const handleViewAllInquiries = () => {
    navigate('/admin/inquiries');
  };

  const handleProposalClick = (proposal) => {
    navigate(`/project/${proposal.projectId}/approval/${proposal.id}`);
  };

  const handleChartClick = (elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const selectedProgress = CHART_LABELS[index];
      setModalTitle(`${selectedProgress} 단계 프로젝트`);
      setShowModal(true);
      setLoading(true);

      try {
        let filteredProjects;
        if (selectedProgress === '완료') {
          filteredProjects = allProjects.filter(project => 
            !project.deleted && (project.currentProgress === 'COMPLETED' || project.currentProgress === '완료')
          );
        } else if (selectedProgress === '기타') {
          filteredProjects = allProjects.filter(project => {
            const normalizedProgress = normalizeProgress(project.currentProgress);
            return !project.deleted && !validStages.includes(normalizedProgress);
          });
        } else {
          filteredProjects = allProjects.filter(project => 
            !project.deleted && normalizeProgress(project.currentProgress) === selectedProgress
          );
        }
        setProjectList(filteredProjects);
      } catch (error) {
        console.error('Error filtering projects:', error);
        setProjectList([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <PageContainer>
      <MainContent>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Card>
              <CardTitle>시스템 현황</CardTitle>
              <CardContent>
                <StatsGrid>
                  <StatItem onClick={() => handleSummaryClick('전체 프로젝트')} style={{ cursor: 'pointer' }}>
                    <StatLabel>전체 프로젝트</StatLabel>
                    <StatValue>{stats.totalProjects}</StatValue>
                  </StatItem>
                  <StatItem onClick={() => handleSummaryClick('진행중인 프로젝트')} style={{ cursor: 'pointer' }}>
                    <StatLabel>진행중인 프로젝트</StatLabel>
                    <StatValue>{stats.activeProjects}</StatValue>
                  </StatItem>
                  <StatItem onClick={() => handleSummaryClick('완료된 프로젝트')} style={{ cursor: 'pointer' }}>
                    <StatLabel>완료된 프로젝트</StatLabel>
                    <StatValue>{stats.completedProjects}</StatValue>
                  </StatItem>
                </StatsGrid>
              </CardContent>
            </Card>

            <Card>
              <CardTitle>프로젝트 현황</CardTitle>
              <CardContent>
                <DoughnutChartSection>
                  <Doughnut 
                    data={projectStatusData}
                    options={doughnutOptions}
                  />
                </DoughnutChartSection>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>관리자 문의 목록</CardTitle>
              <ViewAllButton onClick={handleViewAllInquiries}>
                전체보기
                <ArrowIcon>→</ArrowIcon>
              </ViewAllButton>
            </CardHeader>
            <CardContent>
              <InquiryList>
                {adminInquiries.length > 0 ? (
                  adminInquiries.slice(0, 5).map((inquiry) => (
                    <NoticeItem key={inquiry.id} onClick={() => handleInquiryClick(inquiry.id)}>
                      <NoticeInfo>
                        <NoticeTitle>{inquiry.title}</NoticeTitle>
                        <NoticeMeta>
                          <NoticeCreator>{inquiry.creatorName}</NoticeCreator>
                          <NoticeDate>{formatDate(inquiry.createdAt)}</NoticeDate>
                        </NoticeMeta>
                      </NoticeInfo>
                      <NoticeStatus status={inquiry.inquiryStatus}>
                        {getInquiryStatusText(inquiry.inquiryStatus)}
                      </NoticeStatus>
                    </NoticeItem>
                  ))
                ) : (
                  <EmptyMessage>관리자 문의가 없습니다.</EmptyMessage>
                )}
              </InquiryList>
            </CardContent>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Card>
            <CardTitle>최근 게시물</CardTitle>
            <CardContent>
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <RecentItem key={post.postId} onClick={() => navigate(`/project/${post.projectId}/post/${post.postId}`)}>
                    <RecentInfo>
                      <RecentTitle>{post.title}</RecentTitle>
                      <RecentDate>
                        {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }).replace(/\. /g, '.').slice(0, -1)}
                      </RecentDate>
                    </RecentInfo>
                    <RecentStatus status={post.status}>
                      {post.creatorName}
                    </RecentStatus>
                  </RecentItem>
                ))
              ) : (
                <EmptyMessage>최근 게시물이 없습니다.</EmptyMessage>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardTitle>최근 승인요청</CardTitle>
            <CardContent>
              <RecentList>
                {recentProposals.length > 0 ? (
                  recentProposals.map((proposal) => (
                    <RecentItem key={proposal.id} onClick={() => handleProposalClick(proposal)}>
                      <RecentInfo>
                        <RecentTitle>{proposal.title}</RecentTitle>
                        <RecentDate>{formatDate(proposal.createdAt)}</RecentDate>
                      </RecentInfo>
                      <RecentStatus status={proposal.approvalProposalStatus}>
                        {getInquiryStatusText(proposal.approvalProposalStatus)}
                      </RecentStatus>
                    </RecentItem>
                  ))
                ) : (
                  <EmptyMessage>최근 승인요청이 없습니다.</EmptyMessage>
                )}
              </RecentList>
            </CardContent>
          </Card>
        </div>

        <ProjectStatsCard>
          <ProjectStatsTitle>프로젝트 통계</ProjectStatsTitle>
          <ProjectStatsContent>
            <ProjectStatsGrid>
              <ProjectStatsSection>
                <ProjectStatsChartTitle>월별 프로젝트 통계</ProjectStatsChartTitle>
                <Bar data={monthlyStatsData} options={barOptions} />
              </ProjectStatsSection>
              <ProjectStatsSection>
                <ProjectStatsChartTitle>프로젝트 금액 통계</ProjectStatsChartTitle>
                <Line data={revenueData} options={lineOptions} />
              </ProjectStatsSection>
            </ProjectStatsGrid>
          </ProjectStatsContent>
        </ProjectStatsCard>
      </MainContent>

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{modalTitle}</ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <LoadingMessage>로딩 중...</LoadingMessage>
              ) : projectList.length > 0 ? (
                <ProjectList>
                  {projectList.map((project) => {
                    const dday = calculateDday(project.endDate);
                    const ddayStyle = getDdayStyle(dday);
                    return (
                      <ProjectItem
                        key={project.projectId}
                        onClick={() => navigate(`/project/${project.projectId}`)}
                      >
                        <ProjectInfo>
                          <ProjectName>{project.name}</ProjectName>
                          <ProjectDetails>
                            <ProjectDetail>
                              <DetailLabel>프로젝트 금액:</DetailLabel>
                              <DetailValue>{formatCurrency(project.projectFee)}</DetailValue>
                            </ProjectDetail>
                            <ProjectDetail>
                              <DetailLabel>시작일:</DetailLabel>
                              <DetailValue>{formatDate(project.startDate)}</DetailValue>
                            </ProjectDetail>
                            {project.projectFeePaidDate && (
                              <ProjectDetail>
                                <DetailLabel>정산일:</DetailLabel>
                                <DetailValue>{formatDate(project.projectFeePaidDate)}</DetailValue>
                              </ProjectDetail>
                            )}
                            <ProjectDetail>
                              <DetailLabel>현재 단계:</DetailLabel>
                              <DetailValue>
                                {project.currentProgress === 'COMPLETED' ? '완료' : project.currentProgress}
                              </DetailValue>
                            </ProjectDetail>
                            <ProjectDetail>
                              <DetailLabel>상태:</DetailLabel>
                              <DetailValue>{getStatusText(project.projectStatus)}</DetailValue>
                            </ProjectDetail>
                          </ProjectDetails>
                          <DdayBadge style={ddayStyle}>
                            {dday < 0 ? '마감일 초과' : `D-${dday}`}
                          </DdayBadge>
                        </ProjectInfo>
                      </ProjectItem>
                    );
                  })}
                </ProjectList>
              ) : (
                <EmptyMessage>프로젝트가 없습니다.</EmptyMessage>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 20px;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;
  padding: 10px;
  margin: 20px auto;
  box-sizing: border-box;
  width: 100%;
`;

const Card = styled.div`
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  flex: 1;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
`;

const SystemStatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
  height: 320px;
`;

const StatsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AdminInquirySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 20px;
`;

const AdminInquiryTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
`;

const DoughnutChartSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  height: 300px;
  margin: 0 auto;
  position: relative;
`;

const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0;
  margin-bottom: 0;
`;

const ChartTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 16px;
  text-align: center;
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: #64748b;
`;

const UserDate = styled.div`
  font-size: 13px;
  color: #94a3b8;
`;

const InquiryProjectGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
`;

const InquirySection = styled.div`
  display: flex;
  flex-direction: column;
`;

const InquiryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NoticeItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8fafc;
  }
`;

const NoticeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NoticeTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
`;

const NoticeMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
`;

const NoticeCreator = styled.div`
  font-weight: 500;
  color: #475569;
`;

const NoticeDate = styled.div`
  color: #94a3b8;
`;

const NoticeStatus = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.02em;
  transition: all 0.15s ease;
  background: ${props => {
    switch (props.status) {
      case 'PENDING': return '#FEF3C7';
      case 'IN_PROGRESS': return '#DBEAFE';
      case 'COMPLETED': return '#DCFCE7';
      case 'ON_HOLD': return '#FEE2E2';
      default: return '#F8FAFC';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'PENDING': return '#D97706';
      case 'IN_PROGRESS': return '#2563EB';
      case 'COMPLETED': return '#16A34A';
      case 'ON_HOLD': return '#DC2626';
      default: return '#64748B';
    }
  }};

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    margin-right: 6px;
    background: currentColor;
  }
`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProjectItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  background: white;

  &:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const ProjectName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
`;

const ProjectStatus = styled(NoticeStatus)``;

const ProjectDate = styled.div`
  font-size: 11px;
  color: #94a3b8;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    width: 95%;
  }
`;

const ModalHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
`;

const ModalBody = styled.div`
  padding: 16px;
  overflow-y: auto;
  flex: 1;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  height: 450px;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 24px;
  color: #64748b;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 24px;
  color: #64748b;
`;

const CompanyName = styled.span`
  font-weight: 500;
`;

const PostList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PostItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8fafc;
  }
`;

const PostTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
`;

const PostInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
`;

const PostAuthor = styled.div`
  font-weight: 500;
  color: #475569;
`;

const PostDate = styled.div`
  color: #94a3b8;
`;

const PostStatus = styled(NoticeStatus)``;

const NoticeInquiryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;

const NoticeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NoticeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ViewAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

const ArrowIcon = styled.span`
  font-size: 14px;
  transition: transform 0.2s ease;
  ${ViewAllButton}:hover & {
    transform: translateX(4px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProjectStatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProjectStatsCard = styled(Card)`
  margin-bottom: 0;
`;

const ProjectStatsTitle = styled(CardTitle)`
  margin-bottom: 16px;
`;

const ProjectStatsContent = styled(CardContent)`
  height: 100%;
  padding: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
`;

const ProjectStatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  height: 400px;
  width: 100%;
  overflow: hidden;
`;

const ProjectStatsSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
`;

const ProjectStatsChartTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 12px;
  text-align: center;
`;

const DdayBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.style.color};
  background-color: ${props => props.style.backgroundColor};
`;

const ProjectDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const ProjectDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`;

const DetailLabel = styled.span`
  color: #64748b;
  font-weight: 500;
  min-width: 80px;
`;

const DetailValue = styled.span`
  color: #1e293b;
  font-weight: 500;
`;

const RecentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RecentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8fafc;
  }
`;

const RecentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RecentTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
`;

const RecentDate = styled.div`
  font-size: 11px;
  color: #94a3b8;
`;

const RecentStatus = styled(NoticeStatus)``;

export default DashboardAdmin;