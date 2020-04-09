export const usernameLength = (
  username: string,
  minLength: number,
  maxLength: number
): void => {
  if (username.length < minLength)
    throw new Error('Username must be between 5 and 18 characters.');

  if (username.length > maxLength)
    throw new Error('Username must be between 5 and 18 characters.');
};

export const passwordLength = (
  password: string,
  minLength: number,
  maxLength: number
): void => {
  if (password.length < minLength)
    throw new Error(
      'Password too short. Password must be 8 characters or longer.'
    );

  if (password.length > maxLength)
    throw new Error(
      'Password too long. Password must be 128 characters or shorter.'
    );
};

export const passwordFormat = (password: string, regex: RegExp) => {
  if (!password.match(regex))
    throw new Error(
      'Password must contain at least one uppercase, one lowercase and one number.'
    );
};

export const emailFormat = (email: string, regex: RegExp) => {
  if (!email.match(regex))
    throw new Error(
      'Password must contain at least one uppercase, one lowercase and one number.'
    );
};
