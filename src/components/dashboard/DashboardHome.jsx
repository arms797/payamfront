import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHome() {
    const { user } = useAuth();

    return (
        <>
            <div className="dashboard-welcome">
                <h2>خوش آمدید {user?.firstName} {user?.lastName}</h2>
                <p className="text-muted">
                    نقش فعلی: {user?.currentRoleName}
                </p>
            </div>

            <div className="row g-4 mt-3">
                <div className="col-md-4 col-sm-6">
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon bg-primary-subtle">
                            <i className="bi bi-people fs-2 text-primary"></i>
                        </div>
                        <div className="dashboard-card-body">
                            <h6>تعداد کاربران</h6>
                            <h3>۱۲۴</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 col-sm-6">
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon bg-success-subtle">
                            <i className="bi bi-calendar fs-2 text-success"></i>
                        </div>
                        <div className="dashboard-card-body">
                            <h6>برنامه هفتگی</h6>
                            <h3>۴۲</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 col-sm-6">
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon bg-warning-subtle">
                            <i className="bi bi-mortarboard fs-2 text-warning"></i>
                        </div>
                        <div className="dashboard-card-body">
                            <h6>اساتید</h6>
                            <h3>۱۸</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-main-content mt-4">
                <div className="card">
                    <div className="card-body">
                        <h5>اطلاعیه‌ها</h5>
                        <p className="text-muted">به زودی...</p>
                    </div>
                </div>
            </div>
        </>
    );
}