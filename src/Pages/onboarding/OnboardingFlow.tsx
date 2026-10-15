import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import APIs from '../../services/APIs';
import { updateUser, resetUser } from '../../redux/state/UserFixora';
import logoFixora from '../../assets/logo-fixora.png';
import './OnboardingFlow.css';

const STEPS: { key: Step; label: string }[] = [
  { key: 'GIRO_SELECTION', label: 'Giro' },
  { key: 'COMPANY_DATA', label: 'Empresa' },
  { key: 'BRANCH_DATA', label: 'Sucursal' },
];

const Header: React.FC<{ step: Step }> = ({ step }) => {
  const idx = STEPS.findIndex(s => s.key === step);
  return (
    <>
      <img src={logoFixora} alt="Fixora" className="ob-logo" />
      <div className="ob-steps">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && <div className={`ob-step-line ${i <= idx ? 'done' : ''}`} />}
            <div className={`ob-step ${i === idx ? 'active' : i < idx ? 'done' : ''}`}>
              <span className="dot">{i < idx ? <span className="material-symbols-rounded ob-check">check</span> : i + 1}</span>
              {s.label}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

type Step = 'PROVISIONING' | 'GIRO_SELECTION' | 'COMPANY_DATA' | 'BRANCH_DATA' | 'SUCCESS';

interface Giro {
  id: number;
  name: string;
  description: string;
  icon: string;
}

const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState<Step>('PROVISIONING');
  const [giros, setGiros] = useState<Giro[]>([]);
  const [selectedGiro, setSelectedGiro] = useState<number | null>(null);
  const [companyData, setCompanyData] = useState({ name: '', businessName: '', taxId: '' });
  const [branchData, setBranchData] = useState({ name: '', address: '' });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userEmail = useSelector((state: any) => state.user?.email);
  const userName = useSelector((state: any) => state.user?.name);

  const handleLogout = () => {
    dispatch(resetUser());
    localStorage.removeItem('token-fixora');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const topbar = (
    <div className="ob-topbar">
      <div className="ob-user">
        <span className="material-symbols-rounded">account_circle</span>
        <span className="ob-user-text">{userName || userEmail || 'Sesión iniciada'}</span>
      </div>
      <button type="button" className="ob-logout" onClick={handleLogout}>
        <span className="material-symbols-rounded">logout</span>
        Cerrar sesión
      </button>
    </div>
  );

  useEffect(() => {
    if (step === 'PROVISIONING') {
      // Simulate provisioning delay
      const timer = setTimeout(() => {
        setStep('GIRO_SELECTION');
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (step === 'GIRO_SELECTION') {
      const fetchGiros = async () => {
        try {
          const res: any = await APIs.getAvailableGiros();
          setGiros(res.data || []);
        } catch (err) {
          console.error('Error fetching giros:', err);
        }
      };
      fetchGiros();
    }
  }, [step]);

  const handleCompleteOnboarding = async () => {
    if (!selectedGiro) return;

    try {
      const payload = {
        businessTypeId: selectedGiro,
        company: { ...companyData, taxId: companyData.taxId.trim() || undefined },
        branch: branchData,
      };

      const res: any = await APIs.completeOnboarding(payload);

      if (res.status === 'success') {
        // Update user in redux with the new branchId
        // El sidebar lee activeBranchId/activeCompanyId (no branchId) para pedir los
        // módulos de la sucursal; sin esto seguía sin sucursal hasta volver a loguear.
        dispatch(updateUser({
          branchId: res.data.branchId,
          activeBranchId: res.data.branchId,
          companyId: res.data.companyId,
          activeCompanyId: res.data.companyId,
          companyIds: [res.data.companyId],
        }));
        setStep('SUCCESS');
      } else {
        alert(res.message || 'Error completing onboarding');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      alert('Ocurrió un error al completar el registro. Por favor intenta de nuevo.');
    }
  };

  if (step === 'PROVISIONING') {
    return (
      <div className="onboarding-container centered">
        {topbar}
        <div className="onboarding-card">
          <img src={logoFixora} alt="Fixora" className="ob-logo" />
          <div className="loader"></div>
          <h2>Configurando tu cuenta...</h2>
          <p>Estamos preparando tu espacio de trabajo en Fixora.</p>
        </div>
      </div>
    );
  }

  if (step === 'GIRO_SELECTION') {
    return (
      <div className="onboarding-container">
        {topbar}
        <div className="onboarding-card">
          <Header step="GIRO_SELECTION" />
          <h1>Selecciona tu Giro</h1>
          <p>Elige el tipo de negocio que mejor describa tu actividad para configurar tus módulos.</p>
          <div className="giro-grid">
            {giros.map(giro => (
              <div
                key={giro.id}
                className={`giro-card ${selectedGiro === giro.id ? 'selected' : ''}`}
                onClick={() => setSelectedGiro(giro.id)}
              >
                {selectedGiro === giro.id && (
                  <span className="giro-check material-symbols-rounded">check</span>
                )}
                <div className="giro-icon">
                  {/^[a-z_0-9]+$/.test(giro.icon || '')
                    ? <span className="material-symbols-rounded">{giro.icon}</span>
                    : (giro.icon || <span className="material-symbols-rounded">storefront</span>)}
                </div>
                <div className="giro-info">
                  <h3>{giro.name}</h3>
                  <p>{giro.description}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn-primary"
            disabled={!selectedGiro}
            onClick={() => setStep('COMPANY_DATA')}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'COMPANY_DATA') {
    return (
      <div className="onboarding-container">
        {topbar}
        <div className="onboarding-card">
          <Header step="COMPANY_DATA" />
          <h1>Datos de la Empresa</h1>
          <div className="form-group">
            <label>Nombre Legal</label>
            <input
              type="text"
              value={companyData.name}
              onChange={e => setCompanyData({...companyData, name: e.target.value})}
              placeholder="Ej. Abarrotes S.A. de C.V."
            />
          </div>
          <div className="form-group">
            <label>Nombre Comercial</label>
            <input
              type="text"
              value={companyData.businessName}
              onChange={e => setCompanyData({...companyData, businessName: e.target.value})}
              placeholder="Ej. Super la Economía"
            />
          </div>
          <div className="form-group">
            <label>RFC / Tax ID <span className="ob-optional">(opcional)</span></label>
            <input
              type="text"
              value={companyData.taxId}
              onChange={e => setCompanyData({...companyData, taxId: e.target.value})}
              placeholder="RFC de la empresa"
            />
          </div>
          <div className="button-group">
            <button className="btn-secondary" onClick={() => setStep('GIRO_SELECTION')}>Volver</button>
            <button
              className="btn-primary"
              disabled={!companyData.name || !companyData.businessName}
              onClick={() => setStep('BRANCH_DATA')}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'BRANCH_DATA') {
    return (
      <div className="onboarding-container">
        {topbar}
        <div className="onboarding-card">
          <Header step="BRANCH_DATA" />
          <h1>Datos de la Sucursal</h1>
          <p>Configura la sucursal principal donde operarás.</p>
          <div className="form-group">
            <label>Nombre de la Sucursal</label>
            <input
              type="text"
              value={branchData.name}
              onChange={e => setBranchData({...branchData, name: e.target.value})}
              placeholder="Ej. Sucursal Centro"
            />
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              value={branchData.address}
              onChange={e => setBranchData({...branchData, address: e.target.value})}
              placeholder="Calle, número, colonia..."
            />
          </div>
          <div className="button-group">
            <button className="btn-secondary" onClick={() => setStep('COMPANY_DATA')}>Volver</button>
            <button
              className="btn-primary"
              disabled={!branchData.name}
              onClick={handleCompleteOnboarding}
            >
              Finalizar Registro
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="onboarding-container centered">
        {topbar}
        <div className="onboarding-card success">
          <div className="success-icon"><span className="material-symbols-rounded">check_circle</span></div>
          <h1>¡Todo listo!</h1>
          <p>Hemos configurado tu cuenta y activado tu <strong>prueba gratuita de 15 días</strong>.</p>
          <p>Ya tienes acceso total a los módulos de tu giro.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingFlow;
