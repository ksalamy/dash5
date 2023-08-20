// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0'
import { TextAreaField, TextAreaFieldProps } from './TextAreaField'
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons'

export default {
  title: 'Fields/TextAreaField',
  component: TextAreaField,
} as Meta

const Template: Story<TextAreaFieldProps> = (args) => (
  <div className="bg-contentAreaBackgroundAlt flex p-4">
    <TextAreaField {...args} />
  </div>
)

export const Default = Template.bind({})
Default.args = {
  name: 'description',
  label: 'Description',
  placeholder: 'Enter a brief description about your event...',
}

export const Error = Template.bind({})
Error.args = {
  name: 'description',
  label: 'Description',
  placeholder: 'Enter a brief description about your event...',
  icon: faFileInvoice,
  errorMessage: 'cannot be blank',
}

export const WithErrors = Template.bind({})
WithErrors.args = {
  name: 'description',
  label: 'Description',
  placeholder: 'Enter a brief description about your event...',
  icon: faFileInvoice,
  errors: {
    description: { name: 'description', message: 'cannot be blank' },
  },
}

export const WithInapplicableErrors = Template.bind({})
WithInapplicableErrors.args = {
  name: 'description',
  label: 'Description',
  placeholder: 'Enter a brief description about your event...',
  icon: faFileInvoice,
  errors: { firstName: { name: 'firstName', message: 'cannot be blank' } },
}
