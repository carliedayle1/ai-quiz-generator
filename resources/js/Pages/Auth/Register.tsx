import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Badge } from '@/Components/ui/badge';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface InvitationData {
    email: string;
    role: string;
    token: string;
}

export default function Register({ invitation }: { invitation?: InvitationData }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: invitation?.email || '',
        password: '',
        password_confirmation: '',
        token: invitation?.token || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    if (!invitation) {
        return (
            <GuestLayout>
                <Head title="Register" />
                <div className="text-center py-8">
                    <h2 className="text-lg font-bold text-foreground mb-2">
                        Invitation Required
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Registration is by invitation only. Please contact an administrator
                        to receive an invitation link.
                    </p>
                    <Link
                        href={route('login')}
                        className="text-sm text-primary underline hover:text-primary/80"
                    >
                        Back to Login
                    </Link>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">
                    You've been invited to join as
                </p>
                <Badge variant="default" className="mt-1 text-sm">
                    {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </Badge>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full bg-muted"
                        autoComplete="username"
                        readOnly
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Email is set by your invitation and cannot be changed.
                    </p>

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <input type="hidden" name="token" value={data.token} />

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
