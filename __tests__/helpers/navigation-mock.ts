const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};

const mockUseLocalSearchParams = jest.fn().mockReturnValue({});

const mockUseFocusEffect = jest.fn((cb: () => void | (() => void)) => {
  // Execute the callback immediately in tests
  const cleanup = cb();
  // Return cleanup if provided (for unmount simulation)
  return cleanup;
});

function MockRedirect({ href }: { href: string }) {
  const React = require('react');
  const { Text } = require('react-native');
  return React.createElement(Text, { testID: 'redirect', 'data-href': href }, `Redirect:${href}`);
}

module.exports = {
  router: mockRouter,
  useRouter: () => mockRouter,
  useLocalSearchParams: mockUseLocalSearchParams,
  useFocusEffect: mockUseFocusEffect,
  Redirect: MockRedirect,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
  __mockRouter: mockRouter,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
  __mockUseFocusEffect: mockUseFocusEffect,
};
