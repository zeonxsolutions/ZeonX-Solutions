const CFG = window.ZEONX_CONFIG || {};

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

$('#menuBtn')?.addEventListener('click', () => {
    $('#navLinks')?.classList.toggle('open');
});

$$('[data-register]').forEach(a => {
    a.href = CFG.REGISTRATION_URL;
});

async function api(action, payload = {}) {

    if (
        CFG.DEMO_MODE ||
        !CFG.API_URL ||
        CFG.API_URL.includes('PASTE_')
    ) {
        return demoApi(action, payload);
    }

    const r = await fetch(CFG.API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
            action,
            ...payload
        })
    });

    const data = await r.json();

    if (!data.success) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

function demoStudents() {

    return JSON.parse(
        localStorage.getItem('zeonx_students') || 'null'
    ) || [

        {
            internId: 'ZX-2026-001001',
            name: 'Demo Student',
            email: 'student@demo.com',
            password: 'student123',
            domain: 'Full Stack Development',
            duration: '30 Days',
            status: 'Active',
            completedProjects: 0,
            requiredProjects: 2,

            projects: [
                {
                    title: 'Portfolio Website',
                    github: '',
                    status: 'Pending'
                },
                {
                    title: 'Task Manager App',
                    github: '',
                    status: 'Pending'
                }
            ],

            offerLetter: '',
            certificate: ''

        }

    ];

}

function saveDemo(v) {
    localStorage.setItem(
        'zeonx_students',
        JSON.stringify(v)
    );
}

async function demoApi(action, p = {}) {

    await new Promise(r => setTimeout(r, 250));

    let s = demoStudents();

    switch (action) {

        case 'login':

            if (
                p.email === 'admin@zeonx.com' &&
                p.password === 'admin123'
            ) {
                return {
                    success: true,
                    user: {
                        role: 'admin',
                        name: 'Administrator'
                    }
                };
            }

            {
                const u = s.find(x =>
                    x.email.toLowerCase() === p.email.toLowerCase() &&
                    x.password === p.password
                );

                if (!u) {
                    throw new Error('Invalid email or password');
                }

                return {
                    success: true,
                    user: {
                        ...u,
                        role: 'student'
                    }
                };
            }

        case 'verify': {

            const u = s.find(x =>
                x.internId.toLowerCase() === p.internId.toLowerCase()
            );

            if (!u) {
                throw new Error('Intern ID not found');
            }

            return {
                success: true,
                student: u
            };

        }

        case 'getStudent': {

            const u = s.find(x =>
                x.internId === p.internId
            );

            return {
                success: true,
                student: u
            };

        }

        case 'getStudents':

            return {
                success: true,
                students: s
            };

        case 'addStudent': {

            const n = {
                ...p.student,
                password: p.student.password || 'student123',
                status: 'Active',
                completedProjects: 0,
                requiredProjects: Number(
                    p.student.requiredProjects || 2
                ),

                projects: Array.from(
                    {
                        length: Number(
                            p.student.requiredProjects || 2
                        )
                    },
                    (_, i) => ({
                        title: `Project ${i + 1}`,
                        github: '',
                        status: 'Pending'
                    })
                )
            };

            s.push(n);
            saveDemo(s);

            return {
                success: true,
                student: n
            };

        }

        case 'deleteStudent':

            s = s.filter(x =>
                x.internId !== p.internId
            );

            saveDemo(s);

            return {
                success: true
            };

        case 'addProject': {

            const u = s.find(x =>
                x.internId === p.internId
            );

            u.projects.push({
                title: p.title || `Project ${u.projects.length + 1}`,
                github: '',
                status: 'Pending'
            });

            u.requiredProjects = u.projects.length;

            saveDemo(s);

            return {
                success: true
            };

        }

        case 'submitProject': {

            const u = s.find(x =>
                x.internId === p.internId
            );

            u.projects[p.index].github = p.github;
            u.projects[p.index].status = 'Submitted';

            saveDemo(s);

            return {
                success: true
            };

        }

        case 'updateStatus': {

            const u = s.find(x =>
                x.internId === p.internId
            );

            u.status = p.status;

            saveDemo(s);

            return {
                success: true
            };

        }

        case 'uploadDocument': {

            const u = s.find(x =>
                x.internId === p.internId
            );

            if (!u) {
                throw new Error('Student not found');
            }

            const key =
                p.documentType === 'certificate'
                    ? 'certificate'
                    : 'offerLetter';

            u[key] =
                `data:${p.mimeType || 'application/pdf'};base64,${p.base64}`;

            u[key + 'Name'] =
                p.fileName || `${key}.pdf`;

            saveDemo(s);

            return {
                success: true,
                url: u[key]
            };

        }

        default:

            return {
                success: true
            };

    }

}

function setSession(user) {

    sessionStorage.setItem(
        'zeonx_user',
        JSON.stringify(user)
    );

}

function getSession() {

    return JSON.parse(
        sessionStorage.getItem('zeonx_user') || 'null'
    );

}

function logout() {

    sessionStorage.removeItem('zeonx_user');
    location.href = 'login.html';

}

window.ZeonX = {
    api,
    setSession,
    getSession,
    logout
};