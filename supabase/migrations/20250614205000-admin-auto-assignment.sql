
-- Create function to auto-assign admin role to specific email
CREATE OR REPLACE FUNCTION public.handle_admin_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new user is the admin email
  IF NEW.email = 'kssasarma@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign admin role
DROP TRIGGER IF EXISTS on_auth_user_admin_assignment ON auth.users;
CREATE TRIGGER on_auth_user_admin_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_assignment();

-- Ensure the admin user exists in user_roles if they're already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'kssasarma@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
