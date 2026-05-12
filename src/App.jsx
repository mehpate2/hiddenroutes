import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ExploreApp from './ExploreApp';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChoosePlan from './pages/ChoosePlan';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import PaymentSuccess from './pages/PaymentSuccess';
import Community from './pages/Community';
import DiscoverFeed from './pages/DiscoverFeed';
import SubmitPlace from './pages/SubmitPlace';
import UserProfile from './pages/UserProfile';
import AdminImport from './pages/AdminImport';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';

export default function App() {
  const { loading, toast } = useAuth();

  if (loading) {
    return (
      <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0A0F1E'}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:48,height:48,borderRadius:'50%',border:'3px solid rgba(0,210,255,0.2)',borderTopColor:'#00D2FF',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
          <div style={{color:'rgba(255,255,255,0.5)',fontSize:14,fontFamily:"'Inter',system-ui,sans-serif"}}>Loading ExploreAI…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/choose-plan" element={<ChoosePlan />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/app" element={<ProtectedRoute><ExploreApp /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/community" element={<Community />} />
        <Route path="/discover" element={<DiscoverFeed />} />
        <Route path="/submit" element={<ProtectedRoute><SubmitPlace /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/admin/import" element={<ProtectedRoute><AdminImport /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toast && <Toast msg={toast.msg} type={toast.type} key={toast.id} />}
    </>
  );
}
