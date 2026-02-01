// Initial Data
const INITIAL_DATA = {
    users: [
        { id: 1, username: 'admin', password: 'admin123', name: 'Admin User', role: 'admin' }
    ],
    patients: [
        { id: 1, name: 'John Doe', age: 45, gender: 'Male', blood_group: 'A+', phone: '1234567890', address: '123 Main St', doctor_id: 1, symptoms: 'Chest Pain', registration_date: '2023-01-15' },
        { id: 2, name: 'Jane Smith', age: 32, gender: 'Female', blood_group: 'O-', phone: '0987654321', address: '456 Oak Ave', doctor_id: 2, symptoms: 'Migraine', registration_date: '2023-02-20' },
        { id: 3, name: 'Michael Brown', age: 28, gender: 'Male', blood_group: 'B+', phone: '1122334455', address: '789 Pine Rd', doctor_id: 1, symptoms: 'Flu', registration_date: '2023-03-10' }
    ],
    doctors: [
        { id: 1, name: 'Dr. Sarah Wilson', specialization: 'Cardiology', fee: 150, experience: 8, rating: 4.8 },
        { id: 2, name: 'Dr. James Miller', specialization: 'Pediatrics', fee: 100, experience: 5, rating: 4.5 },
        { id: 3, name: 'Dr. Emily Chen', specialization: 'Neurology', fee: 200, experience: 12, rating: 4.9 }
    ],
    appointments: [
        { id: 1, patient_id: 1, doctor_id: 1, date: '2023-10-25', time: '09:00', status: 'confirmed', reason: 'Routine Checkup' },
        { id: 2, patient_id: 2, doctor_id: 2, date: '2023-10-26', time: '14:30', status: 'pending', reason: 'Fever and Headache' },
        { id: 3, patient_id: 3, doctor_id: 1, date: '2023-10-27', time: '10:00', status: 'pending', reason: 'Annual Physical' }
    ]
};

// State Management
const State = {
    data: null,
    currentUser: null,

    init() {
        const stored = localStorage.getItem('hospital_data');
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            this.data = INITIAL_DATA;
            this.save();
        }
    },

    save() {
        localStorage.setItem('hospital_data', JSON.stringify(this.data));
    },

    login(username, password) {
        const user = this.data.users.find(u => u.username === username && u.password === password);
        if (user) {
            this.currentUser = user;
            return true;
        }
        return false;
    },

    logout() {
        this.currentUser = null;
    }
};

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const modals = document.querySelectorAll('.modal');

// Views Management
function showView(viewName) {
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    navItems.forEach(n => n.classList.remove('active'));

    let activeNav = viewName;
    if (viewName === 'doctor-profile') activeNav = 'doctors';

    document.querySelector(`.nav-item[data-view="${activeNav}"]`)?.classList.add('active');

    document.getElementById('current-page-title').textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);

    renderView(viewName);
}

function renderView(viewName) {
    switch (viewName) {
        case 'dashboard': renderDashboard(); break;
        case 'patients':
            renderPatients();
            renderAppointments(); // Also render appointments here
            break;
        case 'doctors': renderDoctors(); break;
        case 'status': renderStatusView(); break;
        case 'doctor-profile': break; // Handled by specific function
        default: break;
    }
}

// Rendering Functions
function renderDashboard() {
    document.getElementById('stat-patients').innerText = State.data.patients.length;
    document.getElementById('stat-doctors').innerText = State.data.doctors.length;
    document.getElementById('stat-appointments').innerText = State.data.appointments.length;

    const earnings = State.data.appointments
        .filter(a => a.status !== 'cancelled')
        .reduce((sum, appt) => {
            const doc = State.data.doctors.find(d => d.id == appt.doctor_id);
            return sum + (doc ? parseInt(doc.fee) : 0);
        }, 0);
    document.getElementById('stat-earnings').innerText = `₹${earnings}`;


}

window.deletePatient = (id) => {
    if (confirm('Are you sure?')) {
        State.data.patients = State.data.patients.filter(p => p.id !== id);
        // Also remove related appointments
        State.data.appointments = State.data.appointments.filter(a => a.patient_id !== id);
        State.save();
        renderPatients();
        renderDashboard();
    }
};

function renderPatients(data = State.data.patients) {
    const list = document.getElementById('patient-list-body');
    if (!list) return; // Safety check since element might be removed
    list.innerHTML = '';
    data.forEach(p => {
        const row = `<tr>
            <td>#${p.id}</td>
            <td>${p.name}</td>
            <td>${p.age} / ${p.gender}</td>
            <td>${p.blood_group}</td>
            <td>${p.phone}</td>
            <td>
                <button class="btn-icon btn-sm" onclick="editPatient(${p.id})"><i class="fa-solid fa-pencil"></i></button>
                <button class="btn-icon btn-sm" onclick="deletePatient(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
        list.insertAdjacentHTML('beforeend', row);
    });
}

function renderDoctors(data = State.data.doctors) {
    const grid = document.getElementById('doctor-list-grid');
    grid.innerHTML = '';
    data.forEach(d => {
        const card = `
        <div class="doctor-card glass-panel" onclick="openDoctorProfile(${d.id})" style="cursor: pointer;">
            <div class="doc-avatar">${d.name.charAt(0)}</div>
            <h3 class="doc-name">${d.name}</h3>
            <p class="doc-spec">${d.specialization}</p>
            <div class="doc-stats">
                <div class="doc-stat">
                    <small>Fee</small>
                    <span>₹${d.fee}</span>
                </div>
                <div class="doc-stat">
                    <small>Exp</small>
                    <span>${d.experience} Yrs</span>
                </div>
            </div>
        </div>`;
        grid.insertAdjacentHTML('beforeend', card);
    });
}



function renderStatusView() {
    const list = document.getElementById('status-list-body');
    if (!list) return;
    list.innerHTML = '';

    // Filter only CONFIRMED appointments
    const confirmed = State.data.appointments.filter(a => a.status === 'confirmed');

    confirmed.forEach(a => {
        const patient = State.data.patients.find(p => p.id == a.patient_id)?.name || 'Unknown';
        const doctor = State.data.doctors.find(d => d.id == a.doctor_id)?.name || 'Unknown';
        const pObj = State.data.patients.find(p => p.id == a.patient_id);
        const phone = pObj ? pObj.phone : '';

        // Call button
        const callBtn = phone ? `<a href="tel:${phone}" class="btn-icon btn-sm" onclick="markAsCalled(${a.id})" title="Call"><i class="fa-solid fa-phone"></i></a>` : '';
        const style = getRowStyle(a);

        const row = `<tr style="${style}">
            <td>#${a.id}</td>
            <td>${patient}</td>
            <td>${doctor}</td>
            <td>${a.date} <small>${a.time}</small></td>
            <td>
                ${callBtn}
                <button class="btn-icon btn-sm" onclick="deleteAppointment(${a.id})" title="Remove"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
        list.insertAdjacentHTML('beforeend', row);
    });
}

// Render Appointments (Now in Patients View)
function renderAppointments(data = State.data.appointments) {
    const list = document.getElementById('merged-appointment-list');
    if (!list) return; // Safety check
    list.innerHTML = '';

    // Sort: Confirmed first, then Pending, then others
    const statusOrder = { 'confirmed': 1, 'pending': 2 };
    const filteredData = [...data]; // Create a mutable copy
    filteredData.sort((a, b) => {
        const orderA = statusOrder[a.status] || 3;
        const orderB = statusOrder[b.status] || 3;
        return orderA - orderB;
    });

    filteredData.forEach(a => {
        const patient = State.data.patients.find(p => p.id == a.patient_id)?.name || 'Unknown';
        const doctor = State.data.doctors.find(d => d.id == a.doctor_id)?.name || 'Unknown';

        const row = `<tr>
            <td>#${a.id}</td>
            <td>${patient}</td>
            <td>${doctor}</td>
            <td>${a.date} <small>${a.time}</small></td>
            <td><span class="status status-${a.status}">${a.status}</span></td>
            <td>
                <button class="btn-icon btn-sm" onclick="editAppointment(${a.id})" title="Edit"><i class="fa-solid fa-pencil"></i></button>
                <button class="btn-icon btn-sm" onclick="deleteAppointment(${a.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
        list.insertAdjacentHTML('beforeend', row);
    });
}

// Modal Functions
window.openModal = (id) => {
    document.getElementById(id).classList.add('active');
    if (id === 'appointment-modal') populateAppointmentDropdowns();
    if (id === 'patient-modal') populatePatientDoctorDropdown();
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }

    // Reset Patient Form specifically
    if (id === 'patient-modal') {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
            const hiddenId = document.getElementById('patient-id-hidden');
            if (hiddenId) hiddenId.value = '';
            const btn = form.querySelector('button[type="submit"]');
            if (btn) btn.innerText = 'Save Patient';
        }
    }
    // Reset Appointment Form
    if (id === 'appointment-modal') {
        const form = document.getElementById('appointment-form');
        if (form) {
            form.reset();
            const hiddenId = document.getElementById('appt-id-hidden');
            if (hiddenId) hiddenId.value = '';
            const btn = form.querySelector('button[type="submit"]');
            if (btn) btn.innerText = 'Book Appointment';
        }
    }
};

function populatePatientDoctorDropdown() {
    const dSelect = document.getElementById('patient-doctor-select');
    dSelect.innerHTML = '<option value="">Select Doctor</option>';
    State.data.doctors.forEach(d => {
        dSelect.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.name} (${d.specialization})</option>`);
    });
}

function populateAppointmentDropdowns() {
    const pSelect = document.getElementById('appt-patient-select');
    const dSelect = document.getElementById('appt-doctor-select');

    pSelect.innerHTML = '<option value="">Select Patient</option>';
    State.data.patients.forEach(p => {
        pSelect.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.name}</option>`);
    });

    dSelect.innerHTML = '<option value="">Select Doctor</option>';
    State.data.doctors.forEach(d => {
        dSelect.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.name}</option>`);
    });
}

// Actions
window.navigateTo = (view) => showView(view);

window.deleteAppointment = (id) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
        State.data.appointments = State.data.appointments.filter(a => a.id !== id);
        State.save();
        // Refresh views
        const activeView = document.querySelector('.view.active').id;
        if (activeView === 'view-doctor-profile') {
            // We need the doctor ID to refresh the profile. 
            // Ideally we'd store the current doctor ID in a variable.
            // For now, let's trigger a full reload of the profile logic if possible, 
            // or just re-render the view if we had the ID. 
            // Simpler: Just remove the row from the DOM as we did before.
            const btn = document.querySelector(`button[onclick*="deleteAppointment(${id})"]`);
            if (btn) btn.closest('tr').remove();
        } else {
            renderAppointments();
        }
        renderDashboard();
    }
};

window.confirmAppointment = (id) => {
    const appt = State.data.appointments.find(a => a.id === id);
    if (appt) {
        appt.status = 'confirmed';
        State.save();
        // Refresh views
        const activeView = document.querySelector('.view.active').id;
        if (activeView === 'view-doctor-profile') {
            // Update the status badge in the DOM directly for immediate feedback
            const btn = document.querySelector(`button[onclick*="confirmAppointment(${id})"]`);
            if (btn) {
                // Refresh profile
                openDoctorProfile(appt.doctor_id);
            }
        } else {
            renderAppointments();
        }
    }
};

// Initialization
// Doctor Profile Functions
window.openDoctorProfile = (doctorId) => {
    const doctor = State.data.doctors.find(d => d.id == doctorId);
    if (!doctor) return;

    document.getElementById('dp-avatar').innerText = doctor.name.charAt(0);
    document.getElementById('dp-name').innerText = doctor.name;
    document.getElementById('dp-spec').innerText = doctor.specialization;
    document.getElementById('dp-exp').innerText = `${doctor.experience} Years Exp`;
    document.getElementById('dp-fee').innerText = `₹${doctor.fee} Fee`;

    // Get Appointments for this doctor
    // Get Appointments for this doctor
    const doctorAppts = State.data.appointments.filter(a => a.doctor_id == doctorId);

    // Sort Confirmed First
    const statusOrder = { 'confirmed': 1, 'pending': 2 };
    doctorAppts.sort((a, b) => (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3));

    // Also get patients assigned to this doctor (primary care) who might NOT have an appointment
    // For simplicity, let's just list all Appointments as the user requested "visible appoments".
    // If we want to include "Assigned Patients" who don't have appointments, we'd need to merge lists.
    // The user's request focuses on "appointments". Let's show Appointments primarily.

    const list = document.getElementById('doctor-patient-list');
    list.innerHTML = '';

    doctorAppts.forEach(appt => {
        const p = State.data.patients.find(pt => pt.id == appt.patient_id);
        if (!p) return;

        let confirmBtn = '';
        if (appt.status === 'pending') {
            confirmBtn = `<button class="btn-sm btn-primary" onclick="confirmAppointment(${appt.id})">Confirm</button>`;
        } else if (appt.status === 'confirmed') {
            confirmBtn = `<span class="status status-confirmed" style="margin-right: 10px;">Confirmed</span>`;
        }

        const style = getRowStyle(appt);

        const row = `<tr style="${style}">
            <td>
                <div class="patient-info">
                    <strong>${p.name}</strong>
                    <br><small>#${appt.id} • ${appt.status}</small>
                </div>
            </td>
            <td>${p.symptoms || appt.reason || 'N/A'}</td>
            <td>${p.phone}</td>
            <td>${appt.date} <br><small>${appt.time}</small></td>
            <td>
                <a href="tel:${p.phone}" class="btn-icon btn-sm" onclick="markAsCalled(${appt.id})" title="Call" style="display:inline-flex; text-decoration:none;"><i class="fa-solid fa-phone"></i></a>
                ${confirmBtn}
                <button class="btn-icon btn-sm" onclick="completeAppointment(${appt.id})" title="Mark as Completed"><i class="fa-solid fa-check-double"></i></button>
            </td>
        </tr>`;
        list.insertAdjacentHTML('beforeend', row);
    });

    showView('doctor-profile');
};

window.removePatientFromDoctor = (patientId, event) => {
    event.stopPropagation();
    if (confirm('Remove this patient from doctor\'s list?')) {
        const patient = State.data.patients.find(p => p.id == patientId);
        if (patient) {
            patient.doctor_id = null; // Unassign
            State.save();
            // Refresh current profile view
            // We need to know which doctor we are viewing. 
            // In a simple way, we can re-find the doctor from the DOM or State, 
            // but for now let's just re-open the profile of the doctor this patient WAS assigned to.
            // Oh wait, we just removed the assignment locally.
            // Let's just remove the row from DOM for smoother UX or re-render.
            event.target.closest('tr').remove();
        }
    }
};

window.editPatient = (id) => {
    const patient = State.data.patients.find(p => p.id == id);
    if (!patient) return;

    document.getElementById('patient-id-hidden').value = patient.id;
    const form = document.getElementById('patient-form');
    form.name.value = patient.name;
    form.age.value = patient.age;
    form.gender.value = patient.gender;
    form.blood_group.value = patient.blood_group;
    form.phone.value = patient.phone;
    form.address.value = patient.address || '';
    form.doctor_id.value = patient.doctor_id || '';
    form.symptoms.value = patient.symptoms || '';

    // Change Modal Button Text
    const btn = form.querySelector('button[type="submit"]');
    btn.innerText = 'Update Patient';

    openModal('patient-modal');
};

window.editAppointment = (id) => {
    const appt = State.data.appointments.find(a => a.id == id);
    if (!appt) return;

    openModal('appointment-modal'); // This populates dropdowns

    // Now set values
    document.getElementById('appt-id-hidden').value = appt.id;
    const form = document.getElementById('appointment-form');
    // We need to wait for dropdowns? No, synchronous.
    form.patient_id.value = appt.patient_id;
    form.doctor_id.value = appt.doctor_id;
    form.date.value = appt.date;
    form.time.value = appt.time;
    form.reason.value = appt.reason || '';

    // Change Button Text
    form.querySelector('button[type="submit"]').innerText = 'Update Appointment';
};

// Update visual state based on data
function getRowStyle(appt) {
    if (appt.called) {
        return 'background-color: rgba(40, 167, 69, 0.2) !important; color: #155724 !important;';
    }
    return '';
}

window.completeAppointment = (id) => {
    const appt = State.data.appointments.find(a => a.id === id);
    if (!appt) return;

    if (confirm('Mark this appointment as Completed? (This will remove it from the list)')) {
        const doctorId = appt.doctor_id;
        State.data.appointments = State.data.appointments.filter(a => a.id !== id);
        State.save();

        // Refresh Doctor Profile
        openDoctorProfile(doctorId);
        renderDashboard();
    }
};

window.markAsCalled = (id) => {
    const appt = State.data.appointments.find(a => a.id == id);
    if (appt) {
        appt.called = true;
        State.save();

        // precise re-render or reload
        const activeView = document.querySelector('.view.active').id;
        if (activeView === 'view-status') renderStatusView();
        if (activeView === 'view-doctor-profile') openDoctorProfile(appt.doctor_id);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    State.init();

    // Event Listeners
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        if (State.login(u, p)) {
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('dashboard-layout').classList.add('active');
            showView('dashboard');
        } else {
            alert('Invalid credentials!');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        State.logout();
        document.getElementById('dashboard-layout').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            showView(item.dataset.view);
        });
    });

    // Form Submissions
    // Patient Form Submission
    document.getElementById('patient-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get('id');

        // Validation helper
        const required = ['name', 'age', 'phone'];
        for (let field of required) {
            if (!formData.get(field)) {
                alert(`Please fill in ${field}`);
                return;
            }
        }

        if (id) {
            // Update Existing Patient
            const patient = State.data.patients.find(p => p.id == id);
            if (patient) {
                patient.name = formData.get('name');
                patient.age = formData.get('age');
                patient.gender = formData.get('gender');
                patient.blood_group = formData.get('blood_group');
                patient.phone = formData.get('phone');
                patient.address = formData.get('address');
                patient.doctor_id = formData.get('doctor_id');
                patient.symptoms = formData.get('symptoms');

                State.save();
                window.closeModal('patient-modal');
                renderPatients();
                renderDashboard();
                alert('Patient updated successfully!');
            }
        } else {
            // Add New Patient
            const newPatient = {
                id: State.data.patients.length > 0 ? Math.max(...State.data.patients.map(p => p.id)) + 1 : 1,
                name: formData.get('name'),
                age: formData.get('age'),
                gender: formData.get('gender'),
                blood_group: formData.get('blood_group'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                doctor_id: formData.get('doctor_id'),
                symptoms: formData.get('symptoms'),
                registration_date: new Date().toISOString().split('T')[0]
            };
            State.data.patients.push(newPatient);

            // Create Appointment automatically
            const newAppt = {
                id: State.data.appointments.length > 0 ? Math.max(...State.data.appointments.map(a => a.id)) + 1 : 1,
                patient_id: newPatient.id,
                doctor_id: newPatient.doctor_id,
                date: formData.get('appt_date'),
                time: formData.get('appt_time'),
                status: 'pending',
                reason: newPatient.symptoms
            };
            State.data.appointments.push(newAppt);

            State.save();
            window.closeModal('patient-modal');
            renderAppointments(); // Main view now
            renderDashboard();
            alert('Patient registered and appointment booked!');
        }
    });

    document.getElementById('doctor-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newDoctor = {
            id: State.data.doctors.length + 1,
            name: formData.get('name'),
            specialization: formData.get('specialization'),
            fee: formData.get('fee'),
            experience: formData.get('experience'),
            gender: formData.get('gender'),
            address: formData.get('address')
        };
        State.data.doctors.push(newDoctor);
        State.save();
        closeModal('doctor-modal');
        renderDoctors();
        renderDashboard();
        e.target.reset();
    });

    // Filter and Search Listeners
    document.getElementById('patient-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = State.data.patients.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.phone.includes(term)
        );
        renderPatients(filtered);
    });

    document.getElementById('doctor-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = State.data.doctors.filter(d =>
            d.name.toLowerCase().includes(term) ||
            d.specialization.toLowerCase().includes(term)
        );
        renderDoctors(filtered);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.dataset.filter;

            let filtered = State.data.appointments;
            if (status !== 'all') {
                filtered = filtered.filter(a => a.status === status);
            }
            renderAppointments(filtered);
        });
    });

    document.getElementById('appointment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get('id');

        if (id) {
            // Edit Appointment
            const appt = State.data.appointments.find(a => a.id == id);
            if (appt) {
                appt.patient_id = formData.get('patient_id');
                appt.doctor_id = formData.get('doctor_id');
                appt.date = formData.get('date');
                appt.time = formData.get('time');
                appt.reason = formData.get('reason');
                State.save();
                window.closeModal('appointment-modal');

                const activeView = document.querySelector('.view.active').id;
                if (activeView === 'view-doctor-profile') {
                    openDoctorProfile(appt.doctor_id);
                } else {
                    renderAppointments();
                }
                renderDashboard();
                alert('Appointment updated!');
            }
        } else {
            // Add New Appointment
            const newAppt = {
                id: State.data.appointments.length > 0 ? Math.max(...State.data.appointments.map(a => a.id)) + 1 : 1,
                patient_id: formData.get('patient_id'),
                doctor_id: formData.get('doctor_id'),
                date: formData.get('date'),
                time: formData.get('time'),
                status: 'pending',
                reason: formData.get('reason')
            };
            State.data.appointments.push(newAppt);
            State.save();
            renderAppointments();
            renderDashboard();
            closeModal('appointment-modal');
        }
        e.target.reset();
    });
});
