
DROP POLICY "Anyone can update referral on conversion" ON public.referrals;

CREATE POLICY "Users can update referrals they referred" ON public.referrals
  FOR UPDATE TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id)
  WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
